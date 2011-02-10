
/**
 * Browser-dependent implementation of a bundle of strings representing
 * properties.
 *
 * @class
 */

(function() {

    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(Components.interfaces.nsIPrefService)
                          .getBranch("general.useragent.");
                          
    // use Google Chrome-style locale strings (en_US instead of en-US)
    libx.locale.bd.currentLocale = prefs.getCharPref("locale").replace(/-/g, "_");
    
}) ();

libx.locale.bd.getExtensionURL = function (path) {
    return "chrome://libx/content/" + path;
};

libx.locale.bd.initialize = function () {
    libx.locale.getBundle( {
        defaultLocale: "en_US",
        url: "chrome://libx/locale/messages.json",
        success: function (bundle) {
            libx.locale.defaultStringBundle = bundle;
            var localeLoadedEvent = new libx.events.Event("DefaultLocaleLoaded");
            localeLoadedEvent.notify();
        }
    } );  
};
