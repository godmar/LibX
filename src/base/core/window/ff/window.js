
// this namespace is used for Firefox-specific per-window initialization.

libx.ffwindow = {
    
    /* Initialize the browser-specific GUI elements, if needed.
     * In Firefox, this code is called once per new window. 
     * It is called after libx.xul has been loaded.
     */
    initialize : function () {

        // If loading libx for the first time, add libx button to toolbar.
        // Using persist, button will remain there (unless user moves it).
        if (!libx.utils.browserprefs.getStringPref("libx.version", "")) {
            var navbar = document.getElementById("nav-bar");
            var newset = navbar.currentSet + ",libx-button";
            navbar.currentSet = newset;
            navbar.setAttribute("currentset", newset);
            document.persist(navbar.id, "currentset");
            libx.utils.browserprefs.setStringPref("libx.version", "$libxversion$");
        }

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
                    var libxButton = document.getElementById('libx-button');
                    if (libxButton)
                        elem.setAttribute("image", libxButton.image);
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
                            pageUrl: gBrowser.currentURI.spec,
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
            
            libx.utils.getEditionResource({
                url: edition.options.icon,
                success: function (img) {
                    var libxButton = document.getElementById("libx-button");
                    if (libxButton)
                        libxButton.image = img;
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
       
        var windowListeners = {};

        libx.events.addListener('ContentLoaded', {
            onContentLoaded: function(e) {
                if(e.window.top != e.window.self)
                    return;
                var listeners = windowListeners[e.window] = {};
                libx.events.addListener('RequestToContentScript', {
                    onRequestToContentScript: function(e, request, sender, sendResponse) {
                        var reqObj = libx.utils.json.parse(request);
                        if (!(reqObj.type in listeners)) {
                            libx.log.write("invalid request type: " + reqObj.type);
                            return;
                        }
                        listeners[reqObj.type](reqObj, sender, function(response) {
                            var resStr = libx.utils.json.stringify(response);
                            sendResponse(resStr);
                        });
                    }
                }, e.window, e.window);
                var globalScope = {
                
                    // libx.edition may be loaded after this libx clone, so use
                    // global libx
                    libx: libx.global,
                    
                    libxTemp: {
                        addListener : function (name, listener) {
                            listeners[name] = listener;
                        },
                        sendMessage: function (request, callback) {
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
                var files = [
                    "window/shared/autosense.js",
                    "window/ff/contentscript.js",
                    "window/shared/libapp.js",
                    "window/shared/libappbuilder.js"
                ];
                for (var i = 0; i < files.length; i++) {
                    sbox.loadScript("chrome://libx/content/core/" + files[i]);
                }
            }
        }, window);
        
        // remove any content script listeners when tab is closed
        function removeListeners(event) {
            var browser = gBrowser.getBrowserForTab(event.target);
            libx.events.removeListener('RequestToContentScript', browser.contentWindow);
            delete windowListeners[browser.contentWindow];
        }
        var container = gBrowser.tabContainer;
        container.addEventListener("TabClose", removeListeners, false);
        
        var iframe = document.getElementById('libx-iframe'); 

        libx.ffwindow.libxButtonCommand = function (e) {
            iframe.contentWindow.location = "chrome://libx/content/popup/popup.html";
        };
        
        libx.events.addListener('PopupLoaded', {
            onPopupLoaded: function() {

                var $ = iframe.contentWindow.$;
        
                function adjustPopupPosition(e) {

                    // this timeout is required to fix a bug in linux where
                    // switching between full/simple views occasionally makes
                    // the popup shrink too small
                    setTimeout(function() {
                        var width = $('body').outerWidth();
                        var height = $('body').outerHeight();
                        iframe.style.width = width + 'px';
                        iframe.style.height = height +'px';
                    }, 0);
                }
            
                $('body').bind('DOMSubtreeModified', adjustPopupPosition);
                adjustPopupPosition();
                
            }
        });
    }
};

