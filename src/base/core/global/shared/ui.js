
// open search results, according to user preferences
libx.ui.openSearchWindow = function (url, override) {
    
    // performs a POST search with the given query
    if (typeof url != "string") {
        url = libx.locale.getExtensionURL("popup/post.html") + "?" 
            + libx.utils.json.stringify({ url: url[0], data: url[1]});
    }
    
    switch (override ? override : libx.prefs.browser.displaypref._value) {
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
