
libx.ui.tabs = {

    /**
     * Create a tab with the specified URL.
     * 
     * @param {String} URL of page to open
     */
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
    
    removeItem: function (itemId) {
        chrome.contextMenus.remove(itemId);
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
