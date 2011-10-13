
/**
 * Opens a URL in a tab or window.
 * How the page is opened is determined by the user preferences
 * (libx.prefs.browser.displaypref) unless the optional override argument is
 * included.  
 *
 * @param {String} url      the URL of the page to open
 * @param {String} override optional argument that determines how the page is
 *                          opened. if given, this determines how the page will
 *                          be opened rather than the user's display preference.
 *                          can be one of the following: "newwindow", "sametab",
 *                          "newtabswitch", or "newtab".
 */
libx.ui.openSearchWindow = function (url, override) {
    
    // performs a POST search with the given query
    if (typeof url != "string") {
        url = libx.locale.getExtensionURL("popup/post.html") + "?" 
            + libx.utils.json.stringify({ url: url[0], data: url[1]});
    }
    
    var displaypref = libx.prefs.browser && libx.prefs.browser.displaypref && libx.prefs.browser.displaypref._value;
    switch (override ? override : displaypref) {
    case "newwindow":
        libx.ui.windows.create({url: url});
        break;
    case "sametab":
        libx.ui.tabs.getSelected(function (tab) {
            libx.ui.tabs.update(tab.id, {url: url});
        });
        break;
    case "newtabswitch":
        libx.ui.tabs.create({url: url, selected: true});
        break;
    case "newtab":
    default:
        libx.ui.tabs.create({url: url, selected: false});
        break;
    }
        
};
