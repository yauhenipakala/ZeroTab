
const rootView = document.getElementById('root');
let restoredOptions = null;

const apply_background_color = options => {
    rootView.style.backgroundColor = get_is_dark_mode()
        ? options.backgroundColorDark
        : options.backgroundColorLight;
}

const handle_system_color_scheme_change = () => {
    if (!restoredOptions) {
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

restore_options(restore_action);
