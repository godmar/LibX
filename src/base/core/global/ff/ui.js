
(function() {

    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                       .getService(Components.interfaces.nsIWindowMediator);

    function getXulWindow() {
        return wm.getMostRecentWindow("navigator:browser");
    }

    function getBrowser() {
        return getXulWindow().getBrowser();
    }

    function getTabObject(tabId) {
        return {
            id: tabId,
            index: getBrowser().tabContainer.getIndexOfItem(tabId),
            selected: getBrowser().selectedTab == tabId,
            url: getBrowser().getBrowserForTab(tabId).currentURI.spec
        };
    }
        
    // hides the LibX popup
    function hidePopup() {
        getBrowser().contentWindow.focus();
        getXulWindow().document.getElementById('libx-panel').hidePopup();
    }

    /**
     * Set the icon for the LibX button.
     * 
     * @param {String} path  (optional) the data URI or file path. if null,
     *                       sets the generic LibX icon.
     */
    libx.ui.setIcon = function (path) {
        if (!path)
            path = "chrome://libx/skin/$libxicon$";

        // enumerate each browser chrome window
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]  
                           .getService(Components.interfaces.nsIWindowMediator);  
        var enumerator = wm.getEnumerator("navigator:browser");  
        while (enumerator.hasMoreElements()) {  
            var win = enumerator.getNext();  
            var libxButton = win.document.getElementById("libx-button")
            if (libxButton)
                libxButton.setAttribute("image", path);
        }  
    };

    /**
     * Namespace for interacting with browser tabs.
     * Based partially on Chrome API at http://code.google.com/chrome/extensions/tabs.html
     * @namespace
     */
    libx.ui.tabs = {

        /**
         * Get the selected tab.
         * @param {Function(tab)} callback      callback function that receives the tab object
         * @param {Object}        tab.id        the unique ID for this tab
         * @param {Integer}       tab.index     the zero-based index of the tab within its window
         * @param {Boolean}       tab.selected  whether the tab is selected
         * @param {String}        tab.url       the URL the tab is displaying
         */
        getSelected: function(callback) {
            callback(getTabObject(getBrowser().selectedTab));
        },

        /**
         * Modify the properties of a tab.
         * @param  {Object} tabId             the ID of the tab to modify
         * @param  {Object} updateProperties  object containing properties to update
         * @config {String} url               URL to navigate tab to
         */
        update: function(tabId, updateProperties) {
            getBrowser().getBrowserForTab(tabId).loadURI(updateProperties.url);
            hidePopup();
        },
        
        /**
         * Sends a request to the page in the specified tab with an optional callback
         * when a response is sent back.
         * @param {Object} tabId        the ID of the tab to send a message to
         * @param {Object} request      the request to send.  all properties of this
         *                              object will be received by the page.  the
         *                              request must have a type property that
         *                              specifies which listener should handle the
         *                              request.
         * @config {String} type        the type of request to send. a corresponding
         *                              listener with the same type must be
         *                              registered in the page using
         *                              libxTemp.addListener().
         * @param {Function(response)}  callback  callback function that receives the
         *                                        response object
         */
        sendRequest: function(tabId, request, callback) {
            var win = getBrowser().getBrowserForTab(tabId).contentWindow;
            var pageRequest = new libx.events.Event("RequestToContentScript", win);
            var reqStr = libx.utils.json.stringify(request);
            pageRequest.notify(reqStr, null, function(response) {
                if(callback) {
                    var resObj = libx.utils.json.parse(response);
                    callback(resObj);
                }
            });
        },

        /**
         * Creates a new tab.
         * @param  {Object}  createProperties  object containing properties for creation
         * @config {String}  url               URL to navigate new tab to
         * @config {Boolean} selected          whether tab should be selected.
         */
        create: function (createProperties) {
            var url = createProperties.url ? createProperties.url : "about:blank";
            var selected = createProperties.selected !== false;
            var tab = getBrowser().addTab(url);
            if (selected)
                getBrowser().selectedTab = tab;
                
            // if new tab is created by the LibX popup, hide the popup
            hidePopup();
        }
        
    };
    
    /**
     * Namespace for interacting with browser windows.
     * Based partially on Chrome API at http://code.google.com/chrome/extensions/windows.html
     * @namespace
     */
    libx.ui.windows = {
    
        /**
         * Creates a new browser window.
         * @param  {Object} createData  object containing properties for creation
         * @config {String} url         URL to navigate new window to
         */
        create: function (createData) {
            getXulWindow().open(createData.url);
            
            // if new window is created by the LibX popup, hide the popup
            hidePopup();
        }
        
    };
    
    // implements browser-specific methods in libx.ui.ContextMenu
    libx.ui.ContextMenu = libx.core.Class.create(libx.ui.ContextMenu, {

        initialize: function () {
            this.contextItemId = 0;
            this.parent();
        },
        
        addItem: function (item) {
            this.registerItem(this.contextItemId++, item);
        },
        
        update: function (itemId, updateProperties) {
            var item = this.lookupItemId(itemId);
            if (updateProperties.visible != null)
                item.visible = updateProperties.visible;
        }

    });

}) ();
