
libx.ui.setIcon = function (path) {
    if (!path)
        path = libx.utils.getExtensionURL("$libxicon$");
    chrome.browserAction.setIcon({ path: path });
};

libx.ui.tabs = {

    create: function (createData) {
        chrome.tabs.create(createData);
    },
    
    update: function (tabId, updateProperties, callback) {
        chrome.tabs.update(tabId, updateProperties, callback);
    },
    
    getSelected: function (callback) {
        chrome.tabs.getSelected(null, callback);
    },
    
    sendRequest: function (tabId, request, callback) {
    	chrome.tabs.sendRequest(tabId, request, callback);
    }
    
};

libx.ui.windows = {

    create: function (createData) {
        chrome.windows.create(createData);
    }

};

function getVisibilityPattern(visible) {
    if (visible)
        return ["http://*/*", "https://*/*"];
    return ["http://do.not.show.this.item/"];
}

libx.ui.ContextMenu = libx.core.Class.create( libx.ui.ContextMenu,

{

    initialize: function () {
        chrome.contextMenus.removeAll();
        this.parent();
    },
    
    addItem: function (item) {
        var contexts = item.contexts;
        var id = chrome.contextMenus.create({
            type: "normal",
            title: item.title,
            contexts: contexts,
            onclick: function (info) {
                item.onclick(info);
            },
            documentUrlPatterns: getVisibilityPattern(item.visible)
        });
        this.registerItem(id, item);
    },
    
    update: function (itemId, updateProperties) {
    
        // Google Chrome currently has no option to set item visibility, so
        // changing the document url pattern works around this
        if (updateProperties.visible != null) {
            updateProperties.documentUrlPatterns = getVisibilityPattern(updateProperties.visible);
            delete updateProperties.visible;
        }
        chrome.contextMenus.update(itemId, updateProperties);
        
    }            

});
