/**
 * Client-side implementation of libx.ui
 */
libx.ui.setIcon = function (path) {
    // silently ignore
    // throw "libx.ui.setIcon not implemented in client-side";
};

libx.ui.tabs = {

    create: function (createData) {
        window.open(createData.url, '_newtab');
    },
    
    update: function (tabId, updateProperties, callback) {
        // how should we implement this?
        // location.href = updateProperties.url ?
        throw "libx.ui.tabs.update not implemented in client-side";
    },
    
    getSelected: function (callback) {
        throw "libx.ui.tabs.getSelected not implemented in client-side";
    },
    
    sendRequest: function (tabId, request, callback) {
        throw "libx.ui.tabs.sendRequest not implemented in client-side";
    }
    
};

libx.ui.windows = {

    create: function (createData) {
        window.open(createData.url);
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
