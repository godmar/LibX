
popup.pageActions.autoSense = function () {

libx.ui.tabs.sendRequestToSelected( { type: "pageEdition" }, function(response) {
    
    if(!response.edition)
        return;
    
    function loadEdition() {
        libx.cache.defaultMemoryCache.get({
            url: "http://libx.org/editions/config/" + response.edition,
            dataType: "json",
            success: function(json) {
                try {
                    var configUrl = json.revisions[response.revision].config;
                    libx.utils.browserprefs.setStringPref('libx.edition.configurl', configUrl);
                    // reset catalog index when changing editions
                    libx.utils.browserprefs.setIntPref('libx.edition.selectedcatalog', 0);
                    libx.log.write('Loading config from ' + configUrl);
                    libx.loadConfig(configUrl);
                } catch(e) {
                    libx.log.write("Error loading auto-sensed URL " +
                        "http://libx.org/editions/config/" + response.edition + ": " + e);
                }
            }
        });
    }
    
    if(libx.edition) {
        
        function getRevision(version) {
            return parseInt(version.substring(version.lastIndexOf('.') + 1));
        }
        var myRev = getRevision(libx.edition.version);
        var pageRev = getRevision(response.version);
            
        // prompt to update
        if(libx.edition.id != response.edition || pageRev > myRev) {
            var update_message = libx.locale.getProperty("update_message1", myRev, libx.edition.id) + 
                "<br/>" + libx.locale.getProperty("update_message2", pageRev, response.edition);
            var update_link = libx.locale.getProperty("update_link");
            var div = $('<div><p>' + update_message + '</p></div>');
            $('<div><a href="#">' + update_link + '</a></div>').appendTo(div).click(function() {
                loadEdition();
            });
            popup.addPageAction(div);
        }

        // automatically update
        else if(libx.edition.id == response.edition && pageRev == myRev && popup.firstLoad) {
            loadEdition();
        }
    
        // do nothing
            
    } else {
        // user has no edition yet; load edition on current page
        loadEdition();
    }
    
});

};
