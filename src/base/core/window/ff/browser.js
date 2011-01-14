
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
 * @lends libx.browser
 * This is the browser object
 */ 
return { 
	/**
	 *	Initialize the browser-specific GUI elements, if needed.
     *  In Firefox, this code is called once per new window. 
     *  It is called after libx.xul has been loaded.
	 */
	initialize : function () {	

        libx.ui.initialize();
    
        function activateConfiguration(edition) {
            
            libx.edition = edition;
            this.contextMenu = new libx.ui.ContextMenu (libx.ui.basicContextMenuDescriptor, edition);
            
            libx.utils.getEditionResource({
                url: edition.options.icon,
                success: function (data) {
                    document.getElementById('libx-button').image = data;
                }
            });
            
        }
        
        /* Register listener with immediate fire function in case the global
         * libx edition loaded after we cloned the libx object. */        
        libx.events.registerEventListener("EditionConfigurationLoaded", {
            onEditionConfigurationLoaded: function (event) {
                activateConfiguration(event.edition);
            }
        }, function (eventType) {
            var e = null;
            if (libx.global.edition != null) {
                e = new libx.events.Event(eventType);
                e.edition = libx.global.edition;
            }
            return e;
        });
        
        libx.events.addListener('ContentLoaded', {
            onContentLoaded: function(e) {
                if(e.window.top != e.window.self)
                    return;
                var globalScope = {
                
                    // libx.edition may be loaded after this libx clone, so use
                    // global libx
                    libx: libx.global,
                    
                    libxTemp: {
                        addListener : function(listener) {
                            libx.events.addListener('RequestToContentScript', {
                                onRequestToContentScript: function(e, request, sender, sendResponse) {
                                    var reqObj = libx.utils.json.parse(request);
                                    listener(reqObj, sender, function(response) {
                                        var resStr = libx.utils.json.stringify(response);
                                        sendResponse(resStr);
                                    });
                                }
                            }, e.window, e.window);
                        }
                    }
                };
                var sbox = new libx.libapp.Sandbox(e.window, globalScope);
                sbox.loadScript("chrome://libx/content/core/window/shared/ui/autosense.js");
                sbox.loadScript("chrome://libx/content/core/window/ff/window.js");
            }
        }, window);
        
        // remove any content script listeners when tab is closed
        function removeListeners(event) {
            var browser = gBrowser.getBrowserForTab(event.target);
            libx.events.removeListener('RequestToContentScript', browser.contentWindow);
        }
        var container = gBrowser.tabContainer;
        container.addEventListener("TabClose", removeListeners, false);
        
	}
};

})();

