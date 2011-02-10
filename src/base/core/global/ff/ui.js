
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
            window: getBrowser().contentWindow,
            selected: getBrowser().selectedTab == tabId,
            url: getBrowser().getBrowserForTab(tabId).currentURI.spec
        };
    }
        
    function hidePopup() {
        getBrowser().contentWindow.focus();
        getXulWindow().document.getElementById('libx-panel').hidePopup();
    }

    libx.ui.tabs = {
        
        getSelected: function(callback) {
            callback(getTabObject(getBrowser().selectedTab));
        },

        update: function(tabId, updateProperties) {
            getBrowser().getBrowserForTab(tabId).loadURI(updateProperties.url);
            hidePopup();
        },
        
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

        create: function (createProperties) {
            var url = createProperties.url ? createProperties.url : "about:blank";
            var selected = createProperties.selected != false;
            var tab = getBrowser().addTab(url);
            if (selected)
                getBrowser().selectedTab = tab;
                
            // if new tab is created by the LibX popup, hide the popup
            hidePopup();
        }
        
    };
    
    libx.ui.windows = {
    
        create: function (createData) {
            getXulWindow().open(createData.url);
            
            // if new window is created by the LibX popup, hide the popup
            hidePopup();
        }
        
    };
    
    libx.ui.ContextMenu = libx.core.Class.create(libx.ui.ContextMenu,

    {

        initialize: function () {
            this.contextItemId = 0;
            this.parent();
        },
        
        addItem: function (item) {
            this.registerItem(this.contextItemId++, item);
        },
        
        removeItem: function (itemId) {
            
        },
        
        update: function (itemId, updateProperties) {
            var item = this.lookupItemId(itemId);
            if (updateProperties.visible != null)
                item.visible = updateProperties.visible;
        }

    });

}) ();
