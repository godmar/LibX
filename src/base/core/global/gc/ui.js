
/**
 * Google Chrome-specific functionality
 * @namespace
 */

// open search results, according to user preferences
libx.ui.openSearchWindow = function (tabUrl) {
    chrome.tabs.create( { url: tabUrl } );
}

// vim: ts=4
