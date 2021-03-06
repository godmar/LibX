
// No auto-sensing in client-side mode
if (libx.cs === undefined) popup.pageActions.autoSense = function () {
        
function doAutoSense(response) {
    
    if (response === undefined || response.id === undefined) {
        return;
    }
    
    function loadEdition() {
        libx.cache.defaultMemoryCache.get({
            url: "http://libx.org/editions/config/" + response.id,
            dataType: "json",
            success: function(json) {
                try {
                    var configUrl = json.revisions[response.revision].config;
                    libx.utils.browserprefs.setStringPref('libx.edition.configurl', configUrl);
                    // reset catalog index when changing editions
                    libx.utils.browserprefs.setIntPref('libx.popup.selectedcatalog', 0);
                    libx.log.write('Loading config from ' + configUrl);
                    libx.initialize.reload();
                } catch(e) {
                    libx.log.write("Error loading auto-sensed URL " +
                        "http://libx.org/editions/config/" + response.id + ": " + e);
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
        if(libx.edition.id != response.id || pageRev > myRev) {
            
            function showPrompt(name) {
                var update_message = "<p>" + libx.locale.defaultStringBundle.getProperty("update_message1", myRev, libx.edition.id, libx.edition.name.edition) + "</p>"
                    + "<p>" + libx.locale.defaultStringBundle.getProperty("update_message2", pageRev, response.id, name) + "</p>";
                var update_link = libx.locale.defaultStringBundle.getProperty("update_message3", pageRev, response.id, name);
                var div = $('<div>' + update_message + '</div>');
                $('<div><a href="#">' + update_link + '</a></div>').appendTo(div).click(function() {
                    loadEdition();
                });
                popup.addPageAction(div);
            }
            
            if(!response.name) {
                libx.cache.defaultMemoryCache.get({
                    url: "http://libx.org/editions/search?q=" + response.id,
                    dataType: "json",
                    success: function(json) {
                        var name = "Unknown edition";
                        for(var i = 0; i < json.length; i++) {
                            if(json[i].id == response.id) {
                                name = json[i].shortDesc;
                                break;
                            }
                        }
                        showPrompt(name);
                    }
                });
            } else
                showPrompt(response.name);
                
        }

        // automatically update
        else if(libx.edition.id == response.id && pageRev == myRev && popup.firstLoad) {
            loadEdition();
        }
    
        // otherwise, do nothing
            
    } else {
        // user has no edition yet; load edition on current page
        loadEdition();
    }
    
}

// autosense document in the currently selected tab
libx.ui.tabs.getSelected( function (tab) {
    // avoid sending this message to tabs into which we didn't inject a listener,
    // such as chrome://extension. This will avoid 
    // 'Port error: Could not establish connection. Receiving end does not exist.'
    // errors in Chrome
    if (tab.url.match(/https?:\/\//) != null) {
        libx.ui.tabs.sendMessage( tab.id, { type: "pageEdition" }, doAutoSense );
    }
});

};
