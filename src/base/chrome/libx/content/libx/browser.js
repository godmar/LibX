
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
        var editionConfigurationReader = new libx.config.EditionConfigurationReader( {
            url: "chrome://libx/content/config.xml",
            onload: function (edition) {
                libx.edition = edition;

                libx.browser.activateConfiguration(edition);

                libxEnv.doforurls.initDoforurls();  // XXX
                libx.citeulike.notificationicon.initialize();
            },
            onerror: function () {
                libx.log.write ( "ERROR: Config XML Not Found" );
                return;
            }
        });

        //
        // XXX function should end here
        //
        try {
            libx.log.write( "Applying Hotfixes" );
            for ( var i = 0; i < libxEnv.doforurls.hotfixList.length; i++ )
            {
                eval( libxEnv.doforurls.hotfixList[i].text );
            }
        } catch (e) {
            libx.log.write( "Hotfix error " + e.message );
        } 
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

