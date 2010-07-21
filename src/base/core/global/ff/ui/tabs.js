
libx.ui.tabs = (function() {

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

return {
    
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

    create: function (url) {
        var tab = getBrowser().addTab(url);
        getBrowser().selectedTab = tab;
        hidePopup();
    }
    
};

}) ();
