
libx.locale.bd.currentLocale = chrome.i18n.getMessage("@@ui_locale");

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
