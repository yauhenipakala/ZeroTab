let restoredOptions = null;

const get_cached_background_color = () => get_is_dark_mode()
    ? localStorage.getItem(DARK_MODE_BACKGROUND_COLOR_CACHE_KEY) || localStorage.getItem(LEGACY_BACKGROUND_COLOR_KEY) || DARK_MODE_BACKGROUND_COLOR
    : localStorage.getItem(LIGHT_MODE_BACKGROUND_COLOR_CACHE_KEY) || localStorage.getItem(LEGACY_BACKGROUND_COLOR_KEY) || LIGHT_MODE_BACKGROUND_COLOR

const set_background_color = backgroundColor => {
    document.documentElement.style.setProperty('--page-background-color', backgroundColor);
    document.documentElement.style.backgroundColor = backgroundColor;
}

const apply_cached_background_color = () => {
    set_background_color(get_cached_background_color());
}

const apply_background_color = options => {
    const backgroundColor = get_is_dark_mode()
        ? options.backgroundColorDark
        : options.backgroundColorLight;

    set_background_color(backgroundColor);
}

const handle_system_color_scheme_change = () => {
    if (!restoredOptions) {
        apply_cached_background_color();
        return;
    }

    apply_background_color(restoredOptions);
}

const restore_action = options => {
    restoredOptions = options;
    apply_background_color(options);

    if (!window.matchMedia) {
        return;
    }

    const colorSchemeMediaQuery = window.matchMedia(COLOR_SCHEME_QUERY);

    if (colorSchemeMediaQuery.addEventListener) {
        colorSchemeMediaQuery.addEventListener('change', handle_system_color_scheme_change);
        return;
    }

    colorSchemeMediaQuery.addListener(handle_system_color_scheme_change);
}

// Paint from the local cache before chrome.storage.sync finishes restoring options.
if (document.currentScript && document.currentScript.dataset.applyBackground === 'true') {
    apply_cached_background_color();
}

restore_options(restore_action);
