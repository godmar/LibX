
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
    
        // items and listeners that have been added to the context menu;
        // these items need to be cleared when the edition is changed
        var contextMenuEntries = [];
    
        function getSelectionText() {
            var focusedWindow = document.commandDispatcher.focusedWindow;
            var selectionText = focusedWindow.getSelection();
            return selectionText == null ? null : selectionText.toString();
        };
    
        var menu = document.getElementById("contentAreaContextMenu");
        
        menu.addEventListener("popupshowing", function () {
        
            var itemShown = false;
        
            for (var i = 0; i < contextMenuEntries.length; i++) {
            
                var item = contextMenuEntries[i].item;
                var elem = contextMenuEntries[i].elem;
                var showItem = false;
                
                // show items depending on their contexts as defined by:
                // http://code.google.com/chrome/extensions/trunk/contextMenus.html#method-create
                for (var j = 0; j < item.contexts.length; j++) {
                    var context = item.contexts[j];
                    var selectionOrLink = false;
                    
                    if (gContextMenu.isTextSelected) {
                        selectionOrLink = true;
                        if (context == "selection") {
                            showItem = item.visible;
                            break;
                        }
                    }
                    
                    if (gContextMenu.onLink) {
                        selectionOrLink = true;
                        if (context == "link") {
                            showItem = item.visible;
                            break;
                        }
                    }
                    
                    if (!selectionOrLink && context == "page") {
                        showItem = item.visible;
                        break;
                    }
                    
                }
             
                var selection = getSelectionText();
                showItem = showItem && item.match({selectionText: selection});
                elem.setAttribute("label", item.title.replace("%s", selection));
                elem.setAttribute("hidden", !showItem);
                
                // show image for first visible context menu item
                if (showItem && !itemShown) {
                    elem.setAttribute("image", document.getElementById('libx-button').image);
                    itemShown = true;
                } else
                    elem.setAttribute("image", "");
             
            }
            
            // only show context menu separator if at least one item is visible
            var separator = document.getElementById("libx-context-menu-separator");
            separator.setAttribute("hidden", !itemShown);

        }, false);
    
        function activateConfiguration(edition) {
            
            libx.edition = edition;
            
            // clear existing context menu items, if any
            while (contextMenuEntries.length) {
                var entry = contextMenuEntries.pop();
                menu.removeChild(entry.elem);
            }
            
            var items = libx.ui.contextMenu.items;
            
            for (var i = 0; i < items.length; i++) {
            
                (function () {
            
                    // add edition's context menu items to browser context menu
                    var item = items[i].item;
                    var menuItem = document.createElement("menuitem");
                    menu.insertBefore(menuItem, document.getElementById("libx-endholder"));
                    menuItem.setAttribute("class", "menuitem-iconic");
                    menuItem.addEventListener('click', function () {
                        var info = {
                            linkUrl: gContextMenu.linkURL,
                            selectionText: getSelectionText()
                        };
                        item.onclick(info);
                    }, true );

                    contextMenuEntries.push({
                        elem: menuItem,
                        item: item
                    });
                
                }) ();
                
            }
            
            document.getElementById("libx-button").image = edition.options.icon;
            
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
                        },
                        sendRequest: function (request, callback) {
                            var reqStr = libx.utils.json.stringify(request);
                            new libx.events.Event('RequestFromContentScript').notify(reqStr, null, function (response) {
                                if (callback) {
                                    var resObj = libx.utils.json.parse(response);
                                    callback(resObj);
                                }
                            });
                        }
                    }
                };
                var sbox = new libx.libapp.Sandbox(e.window, globalScope);
                sbox.loadScript("chrome://libx/content/core/window/shared/autosense.js");
                if (libx.global.edition != null) {
                    sbox.loadScript("chrome://libx/content/core/window/ff/window.js");
                }
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

