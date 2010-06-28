
libx.ui.tabs = {
            
    /**
     * Send a request to the user's currently open tab.
     * 
     * @param {Object}   request to send
     * @param {Function} function to execute upon completion
     */
    sendRequestToSelected: function(request, callback) {
        chrome.tabs.getSelected(null, function(tab) {
            chrome.tabs.sendRequest(tab.id, request, callback);
        });
    },

    /**
     * Create a tab with the specified URL.
     * 
     * @param {String} URL of page to open
     */
    // open search results, according to user preferences
    create: function (tabUrl) {
        chrome.tabs.create( { url: tabUrl } );
    }
    
};