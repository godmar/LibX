
/**
 *
 *  @namespace libx.browser
 *	@constructor
 *	libx.browser namespace
 *	Responsible for holding the instantiated objects for 
 *	browser abstractions ( ie, context menu, toolbar )
 */
libx.browser = (function () { 

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
          
		libx.ui.initialize();
		
		// To implement:  this.toolbar = new Toolbar();

        function activateConfiguration(edition) {
            libx.edition = edition;
            libx.log.write("Activating configuration: " + libx.edition.name.long);
            libx.ui.activateConfiguration (edition);
            this.contextMenu = new libx.ui.ContextMenu (libx.ui.basicContextMenuDescriptor, edition);
            libx.citeulike.notificationicon.initialize();

            // Load all URLs marked as @type = 'bootwindow' in configuration
            var bootWindowUrls = libx.edition.localizationfeeds.bootwindow;
            if (bootWindowUrls.length == 0) {
                // Fall back to local preference
                bootWindowUrls.push({ url:
                    libx.utils.browserprefs.getStringPref("libx.bootstrap.window.url", 
                        "http://libx.org/libx-new/src/base/bootstrapped/bootstrapwindow.js") });
            }
        
            var windowBootStrapper = new libx.bootstrap.BootStrapper();
            if (!libx.initialize.globalBootStrapper.hasFinished) {
                /* Global boot strapping still in progress.  Delay bootstrapping
                 * of window scripts until this is done. */
                var blockUntilGlobalBootstrapDone = new libx.utils.collections.EmptyActivity();
                windowBootStrapper.scriptQueue.scheduleFirst(blockUntilGlobalBootstrapDone);

                libx.events.addListener("GlobalBootstrapDone", {
                    onGlobalBootstrapDone: function (globalBootstrapDoneEvent) {
                        blockUntilGlobalBootstrapDone.markReady();
                    }
                });
            }

            for (var i = 0; i < bootWindowUrls.length; i++)
                windowBootStrapper.loadScript(bootWindowUrls[i].url, true, {
                    libx: libx,
                    window: window,
                });
            
            /* Get icon remotely. Temporary implementation until IO is
             * implemented and icon is stored locally. */
            var configUrl = libx.utils.browserprefs.getStringPref('libx.edition.configurl', null);
            if(configUrl != null) {
                var iconUrl = configUrl.replace('/config.xml', '')
                    + edition.options.icon.replace('chrome://libx/skin', '');
                libx.log.write('Loaded config ' + configUrl);
                libx.log.write('Loaded icon ' + iconUrl);
                document.getElementById('libx-button').image = iconUrl;
            }
            
        }

        /* Register listener with immediate fire function in case the global
         * libx edition loaded after we cloned the libx object. */        
        libx.events.registerEventListener("EditionConfigurationLoaded", {
            onEditionConfigurationLoaded: function (event) {
                libx.log.write("Config loaded!");
                activateConfiguration(event.edition);
            }
        }, function (eventType) {
            var e = null;
            if (libx.global.edition != null) {
                libx.log.write("Creating event!");
                e = new libx.events.Event(eventType);
                e.edition = libx.global.edition;
            }
            return e;
        });
	}
};

return browser;
})();

