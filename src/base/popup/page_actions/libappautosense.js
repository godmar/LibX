
popup.pageActions.lbAutoSense = function () {
        
function doAutoSense(response) {
    
    if (!response.url)
        return;
        
    var div = $('<div>Autosensed: "' + response.url + '"</div>');
    $('<div><a href="#">Load this feed</a></div>')
        .appendTo(div)
        .click(function () {
            libx.prefs.libapps.feeds._setValue([]); // clears selected feeds
            libx.prefs.libapps.feeds._addItem({
                _value: response.url,
                _type: "string",
                _selected: true
            });
            libx.preferences.save();
            libx.libapp.loadLibapps(libx.edition);
        });
    popup.addPageAction(div);
    
}

if (!libx.edition)
    return;

// autosense document in the currently selected tab
libx.ui.tabs.getSelected( function (tab) {
    libx.ui.tabs.sendRequest( tab.id, { type: "libappAutosense" }, doAutoSense );
});

};
