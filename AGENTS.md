# ZeroTab Agent Guide

## Project Summary

ZeroTab is a minimal Chrome extension that replaces the browser new tab page with an empty page. The only user-facing customization in the current product is a background color option stored in Chrome sync storage.

This repository also contains a simple static marketing page in `docs/`, but the extension itself lives in `src/` and is built into `dist/` and `publish/`.

## Product Specs

- Extension type: Chrome extension, Manifest V3
- Primary behavior: override the default new tab page with `src/index.html`
- Current option set: `backgroundColorLight` and `backgroundColorDark`
- Default light background color: `#ffffff`
- Default dark background color: `#35363a`
- Persistent storage: `chrome.storage.sync`
- Options UI: `src/options.html` with a native `<input type="color">`
- Required Chrome permission: `storage`
- Icon set currently shipped: `src/icon_128.png`

## Runtime Behavior

### New Tab Page

- `src/index.html` loads `common.js` and `index.js` in the document head so the page background can be painted before `chrome.storage.sync` returns
- `src/index.js` applies a cached background color immediately, then reads saved options and applies either the light or dark background color based on the current system theme
- The page title is intentionally blank-like and there is no additional UI

### Options Page

- `src/options.html` shows separate light-theme and dark-theme color pickers
- `src/options.js` restores both saved colors on load
- Changing either color immediately writes the new values to `chrome.storage.sync`

### Shared Logic

- `src/common.js` defines the default light and dark colors, theme detection helpers, and option normalization
- `restore_options(restore_action)` wraps `chrome.storage.sync.get` and normalizes legacy single-color installs

## Source Layout

- `src/manifest.json`: source manifest with a `version_auto` placeholder
- `src/index.html`: new tab page HTML
- `src/index.js`: new tab behavior
- `src/options.html`: options UI
- `src/options.js`: options persistence
- `src/common.js`: shared defaults and restore helper
- `src/icon_128.png`: extension icon
- `gulpfile.js`: build pipeline for minified JS and HTML
- `build.sh`: packaging script that assembles the distributable zip
- `docs/index.html`: separate landing page, not part of the extension package
- `README.md`: public project overview

## Build And Release Flow

### Local Dependencies

- Node dependencies are managed with `npm`
- The repo already uses local CLI execution, so prefer `npx gulp build` instead of relying on a global `gulp`

### Build Output

- `npx gulp build` deletes `dist/`, then rebuilds minified assets into `dist/`
- JS inputs: `src/common.js`, `src/index.js`, `src/options.js`
- HTML inputs: `src/index.html`, `src/options.html`
- `dist/` contains only built JS and HTML

### Packaging

- `./build.sh` is the release packaging entry point
- It cleans `publish/`, runs `npx gulp build`, copies built files plus `src/manifest.json` and `src/*.png` into `publish/`
- It replaces `version_auto` in the copied manifest with the shell `VERSION` value
- It creates `publish/ZeroTab-<VERSION>.zip`

### Versioning Caveat

- `package.json` currently says `1.0.0`
- `build.sh` currently packages version `1.1.0`
- `src/manifest.json` is not the source of truth for the final version; `build.sh` injects the shipped version during packaging

## Important Constraints

- Keep the extension dependency-light and framework-free unless there is a strong reason to change that
- The source manifest must keep the `version_auto` placeholder or packaging will stop working
- If you add new packaged assets, update `build.sh` if the current copy rules do not include them
- `docs/` is independent from the extension build; changes there do not affect the packaged extension
- `dist/` and `publish/` are generated and ignored by git
- The `npm test` script is a placeholder and currently exits with an error by design

## Editing Guidelines

### When Adding A New Option

- Add the default value and any migration logic to `src/common.js`
- Update `src/options.html` with the new control
- Update `src/options.js` restore and save logic
- Update `src/index.js` if the option affects new tab rendering

### When Changing Build Behavior

- Keep `gulpfile.js` aligned with the installed package APIs
- The current clean task uses `deleteAsync` from `del`
- Minification happens during build, so debug source behavior in `src/`, not generated files

### When Changing Packaging

- The packaging flow lives in `build.sh`
- `build.sh` uses `sed -i ""`, which is the macOS/BSD form

## Verification Checklist

- Run `npx gulp build` after source edits
- If packaging changes were made, run `./build.sh`
- For manual browser verification, load the built extension from `publish/` after packaging
- Confirm that:
  - a new tab opens to an empty page
  - the light-theme and dark-theme colors switch with the OS theme
  - the selected background colors persist
  - the options page restores both saved values

## Current Known Gaps

- No automated tests
- No linting or formatting automation
- No Firefox-specific packaging or compatibility workflow
- The release script assumes a macOS-style `sed`
