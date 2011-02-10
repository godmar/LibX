
/**
 * Browser-dependent implementation of a bundle of strings representing
 * properties.
 *
 * @class
 */

libx.locale.bd.currentLocale = chrome.i18n.getMessage("@@ui_locale");

libx.locale.bd.getExtensionURL = function (path) {
    return chrome.extension.getURL(path);
};

libx.locale.bd.initialize = function () {
    libx.locale.getBundle( {
        url: chrome.extension.getURL("_locales/$locale$/messages.json"),
        defaultLocale: "en_US",
        success: function (bundle) {
            libx.locale.defaultStringBundle = bundle;
            var localeLoadedEvent = new libx.events.Event("DefaultLocaleLoaded");
            localeLoadedEvent.notify();
        }
    } );
};