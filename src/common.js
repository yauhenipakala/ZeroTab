const LIGHT_MODE_BACKGROUND_COLOR = '#ffffff'
const DARK_MODE_BACKGROUND_COLOR = '#35363a'
const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)'
const LEGACY_BACKGROUND_COLOR_KEY = 'backgroundColor'
const STORAGE_KEYS = [LEGACY_BACKGROUND_COLOR_KEY, 'backgroundColorLight', 'backgroundColorDark']
const LIGHT_MODE_BACKGROUND_COLOR_CACHE_KEY = 'backgroundColorLight'
const DARK_MODE_BACKGROUND_COLOR_CACHE_KEY = 'backgroundColorDark'

const get_is_dark_mode = () => window.matchMedia && window.matchMedia(COLOR_SCHEME_QUERY).matches

const normalize_options = options => {
    const legacyBackgroundColor = typeof options[LEGACY_BACKGROUND_COLOR_KEY] === 'string'
        ? options[LEGACY_BACKGROUND_COLOR_KEY]
        : null;
    const backgroundColorLight = typeof options.backgroundColorLight === 'string'
        ? options.backgroundColorLight
        : legacyBackgroundColor || LIGHT_MODE_BACKGROUND_COLOR;
    const backgroundColorDark = typeof options.backgroundColorDark === 'string'
        ? options.backgroundColorDark
        : legacyBackgroundColor || DARK_MODE_BACKGROUND_COLOR;

    return {
        backgroundColorDark,
        backgroundColorLight
    };
}

const cache_background_colors = options => {
    // chrome.storage.sync is async, so keep a local cache for the first paint path.
    try {
        localStorage.setItem(LIGHT_MODE_BACKGROUND_COLOR_CACHE_KEY, options.backgroundColorLight);
        localStorage.setItem(DARK_MODE_BACKGROUND_COLOR_CACHE_KEY, options.backgroundColorDark);
    } catch (error) {
        // Ignore storage failures and fall back to the built-in theme defaults.
    }
}

const restore_options = restore_action => {
    chrome.storage.sync.get(STORAGE_KEYS, options => {
        const normalizedOptions = normalize_options(options);

        cache_background_colors(normalizedOptions);
        restore_action(normalizedOptions);
    });
}
