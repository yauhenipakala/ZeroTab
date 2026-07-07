const backgroundColorLightOption = document.getElementById('background_color_light');
const backgroundColorDarkOption = document.getElementById('background_color_dark');

const save_options = () => {
    const options = {
        backgroundColorLight: backgroundColorLightOption.value,
        backgroundColorDark: backgroundColorDarkOption.value
    };

    cache_background_colors(options);
    chrome.storage.sync.set(options);
}

const restore_action = options => {
    backgroundColorLightOption.value = options.backgroundColorLight;
    backgroundColorDarkOption.value = options.backgroundColorDark;
}

restore_options(restore_action);

backgroundColorLightOption.addEventListener("change", save_options, false);
backgroundColorDarkOption.addEventListener("change", save_options, false);
