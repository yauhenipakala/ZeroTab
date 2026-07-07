const LIGHT_MODE_BACKGROUND_COLOR = '#ffffff'
const DARK_MODE_BACKGROUND_COLOR = '#35363a'
const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)'
const STORAGE_KEYS = ['backgroundColor', 'backgroundColorLight', 'backgroundColorDark']

const get_is_dark_mode = () => window.matchMedia && window.matchMedia(COLOR_SCHEME_QUERY).matches

const normalize_options = options => {
    const legacyBackgroundColor = typeof options.backgroundColor === 'string'
        ? options.backgroundColor
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

const restore_options = restore_action => {
    chrome.storage.sync.get(STORAGE_KEYS, options => {
        restore_action(normalize_options(options));
    });
}
