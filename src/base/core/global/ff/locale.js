
(function() {

    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(Components.interfaces.nsIPrefService)
                          .getBranch("general.useragent.");
                          
    /**
     * The current locale being used by the browser.
     * The locale string uses Chrome style (en_US instead of en-US)
     * @type String
     */
    libx.locale.bd.currentLocale = prefs.getCharPref("locale").replace(/-/g, "_");
    
}) ();

/**
 * Browser-dependent function for getting the extension URL for a resource.
 * 
 * @param   {String} path  resource name
 * @returns {String} absolute extension URL for the given resource
 */
libx.locale.bd.getExtensionURL = function (path) {
    return "chrome://libx/content/" + path;
};

/**
 * Browser-dependent initialization function for locales.
 */
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
