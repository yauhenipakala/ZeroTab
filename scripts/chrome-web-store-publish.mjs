import { createSign } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const {
    CHROME_WEB_STORE_BLOCK_ON_WARNINGS = 'true',
    CHROME_WEB_STORE_ITEM_NAME,
    CHROME_WEB_STORE_PUBLISH_TYPE = 'default',
    CHROME_WEB_STORE_DEPLOY_PERCENTAGE = '',
    CHROME_WEB_STORE_SKIP_REVIEW = 'false',
    CHROME_WEB_STORE_SERVICE_ACCOUNT_JSON,
    ZIP_PATH
} = process.env;

const requiredEnv = [
    'CHROME_WEB_STORE_ITEM_NAME',
    'CHROME_WEB_STORE_SERVICE_ACCOUNT_JSON',
    'ZIP_PATH'
];

for (const name of requiredEnv) {
    if (!process.env[name]) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
}

const base64UrlEncode = value => Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const signJwt = (header, payload, privateKey) => {
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const signer = createSign('RSA-SHA256');

    signer.update(unsignedToken);
    signer.end();

    const signature = signer.sign(privateKey)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');

    return `${unsignedToken}.${signature}`;
}

const getAccessToken = async serviceAccount => {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const assertion = signJwt(
        {
            alg: 'RS256',
            typ: 'JWT'
        },
        {
            iss: serviceAccount.client_email,
            scope: 'https://www.googleapis.com/auth/chromewebstore',
            aud: 'https://oauth2.googleapis.com/token',
            exp: nowInSeconds + 3600,
            iat: nowInSeconds
        },
        serviceAccount.private_key
    );
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to obtain access token: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();

    return data.access_token;
}

const chromeWebStoreRequest = async (accessToken, path, init = {}) => {
    const response = await fetch(`https://chromewebstore.googleapis.com${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            ...init.headers
        }
    });
    const rawBody = await response.text();
    const body = rawBody ? JSON.parse(rawBody) : {};

    if (!response.ok) {
        throw new Error(`Chrome Web Store API request failed for ${path}: ${response.status} ${rawBody}`);
    }

    return body;
}

const sleep = milliseconds => new Promise(resolve => {
    setTimeout(resolve, milliseconds);
});

const waitForUpload = async accessToken => {
    for (let attempt = 1; attempt <= 20; attempt += 1) {
        const status = await chromeWebStoreRequest(
            accessToken,
            `/v2/${CHROME_WEB_STORE_ITEM_NAME}:fetchStatus`
        );
        const uploadState = status.lastAsyncUploadState;

        console.log(`Upload status attempt ${attempt}: ${uploadState || 'unknown'}`);

        if (!uploadState || uploadState === 'SUCCEEDED') {
            return status;
        }

        if (uploadState === 'FAILED') {
            throw new Error('Chrome Web Store upload failed.');
        }

        await sleep(5000);
    }

    throw new Error('Timed out waiting for Chrome Web Store upload processing to finish.');
}

const getPublishBody = () => {
    const publishType = CHROME_WEB_STORE_PUBLISH_TYPE === 'staged'
        ? 'STAGED_PUBLISH'
        : 'DEFAULT_PUBLISH';
    const deployPercentage = CHROME_WEB_STORE_DEPLOY_PERCENTAGE.trim();
    const body = {
        publishType,
        blockOnWarnings: CHROME_WEB_STORE_BLOCK_ON_WARNINGS === 'true',
        skipReview: CHROME_WEB_STORE_SKIP_REVIEW === 'true'
    };

    if (deployPercentage) {
        body.deployInfos = [{
            deployPercentage: Number.parseInt(deployPercentage, 10)
        }];
    }

    return body;
}

const main = async () => {
    const serviceAccount = JSON.parse(CHROME_WEB_STORE_SERVICE_ACCOUNT_JSON);
    const accessToken = await getAccessToken(serviceAccount);
    const zipBuffer = await readFile(ZIP_PATH);

    console.log(`Uploading ${ZIP_PATH} to ${CHROME_WEB_STORE_ITEM_NAME}`);

    const uploadResult = await chromeWebStoreRequest(
        accessToken,
        `/upload/v2/${CHROME_WEB_STORE_ITEM_NAME}:upload`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/zip'
            },
            body: zipBuffer
        }
    );

    console.log(`Upload started for version: ${uploadResult.crxVersion || 'processing'}`);

    const statusAfterUpload = await waitForUpload(accessToken);

    console.log(`Latest upload state: ${statusAfterUpload.lastAsyncUploadState || 'n/a'}`);

    const publishResult = await chromeWebStoreRequest(
        accessToken,
        `/v2/${CHROME_WEB_STORE_ITEM_NAME}:publish`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(getPublishBody())
        }
    );

    console.log('Publish submission accepted.');
    console.log(JSON.stringify(publishResult, null, 2));

    if (publishResult.warningInfo && publishResult.warningInfo.warnings.length > 0) {
        console.log('Publish warnings:');

        for (const warning of publishResult.warningInfo.warnings) {
            console.log(`- ${warning.reason}: ${warning.description}`);
        }
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
