
/**
 *
 *  @namespace libx.browser
 *	@constructor
 *	libx.browser namespace
 *	Responsible for holding the instantiated objects for 
 *	browser abstractions ( ie, context menu, toolbar )
 */
libx.browser = (function () { 
/** @private */
var contextMenu;

/**
 *	This is the browser object
 */
var browser = 
/** @lends libx.browser */
{ 
	/**
	 *	Initialize the browser-specific GUI elements, if needed.
     *  In Firefox, this code is called once per new window. 
     *  It is called after libx.xul has been loaded.
	 */
	initialize : function () {	
		// Initialize the browser preferences
        libx.preferences.load ( {
            filename : "chrome://libx/content/browser.prefs.xml",
            overwrite : false,
            base : "libx.prefs"
        } );  
          
		libx.bd.initialize();
		
		// To implement:  this.toolbar = new Toolbar();
        new libx.config.EditionConfigurationReader( {
            url: "chrome://libx/content/config.xml",
            onload: function (edition) {
                libx.edition = edition;

                libx.browser.activateConfiguration(edition);
                libx.citeulike.notificationicon.initialize();

                // now pull in additional files - location to be determined
                // var editionRoot = libx.edition.localizationfeeds.primary;
                var editionRoot = null;
                var bootstrapUrl = editionRoot || 
                    libx.utils.browserprefs.getStringPref("libx.bootstrap.window.url", 
                        "http://libx.org/libx-new/src/libx2/bootstrapwindow.js");

                libx.bootstrap.loadScript(bootstrapUrl);
            },
            onerror: function () {
                libx.log.write ( "ERROR: Config XML Not Found" );
                return;
            }
        });

	},
	
	/**
	 * Activate a given configuration.
	 *
	 * @param edition edition configuration object
	 */
	activateConfiguration : function (edition) {
        libx.bd.activateConfiguration (edition);
		contextMenu = this.contextMenu = 
            new libx.ui.ContextMenu 
                (libx.ui.basicContextMenuDescriptor, edition);
	}
};


return browser;
})();

