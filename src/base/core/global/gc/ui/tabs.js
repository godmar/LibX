
libx.ui.tabs = {

    /**
     * Create a tab with the specified URL.
     * 
     * @param {String} URL of page to open
     */
    create: function (tabUrl) {
        chrome.tabs.create( { url: tabUrl } );
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