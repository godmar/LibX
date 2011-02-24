
libxTemp.addListener(function(request, sender, sendResponse) {
    
    if(request.type == "pageEdition") {
        
        try {
            var meta = document.getElementsByTagName("meta");
            for (var i = 0; i < meta.length; i++) {
                if (meta[i].getAttribute('name') == "libxeditioninfo") {
                    var content = meta[i].getAttribute('content');
                    var m = content.match(/^(.*?)(\.(\d+))?;([0-9\.]+)(;(.*))?$/);
                    if (m) {
                        var id = m[1];
                        var revision = m[3] || "live";
                        var version = m[4];
                        var name = m[6];
                        libx.log.write("Sensing: id=" + id 
                                    + ", revision=" + revision
                                    + ", version=" + version
                                    + ", description=" + name);
                        sendResponse({
                            id: id,
                            revision: revision,
                            version: version,
                            description: name
                        });
                        break;
                    }
                }
            }
        } catch (er) {
            libx.log.write(er);
            sendResponse({});
        }
    } else if(request.type == "libappAutosense") {
        
        try {
            var links = document.getElementsByTagName("link");
            for (var i = 0; i < links.length; i++) {
                if (links[i].getAttribute('name') == "temp_feed") {
                    var url = links[i].getAttribute('href');
                    sendResponse({
                        url: url
                    });
                    break;
                }
            }
        } catch (er) {
            libx.log.write(er);
            sendResponse({});
        }
        
    } else {
        sendResponse({});
    }
    
});

$(function () {

    function loadFeeds(span) {
    
        var feeds;
        try {
            feeds = libx.utils.json.parse($(span).text());
        } catch (e) {
            libx.log.write("Cannot parse feed data: " + e);
            return;
        }
        
        libx.libapp.clearTempPackages();
        
        for (var i = 0; i < feeds.length; i++) {
             var permUrl = feeds[i].permUrl,
                 tempUrl = feeds[i].tempUrl;
            
            var packages = libx.libapp.getEnabledPackages();
            for (var j = 0; j < packages.length; j++) {
                if (packages[j].url == permUrl) {
                    if (libx.prefs[permUrl]) {
                        libx.prefs[permUrl]._enabled._setValue(false);
                    }
                }
            }
            
            libx.log.write("Registering temp package: " + tempUrl + ", disabling permanent package: " + permUrl);
            
            libx.libapp.addTempPackage(permUrl, tempUrl);
            libx.libapp.loadLibapps(tempUrl);
        }
        
    }
    

    $("#libappBuilderNotify")
        .bind("DOMNodeInserted", function (e) {
            loadFeeds(e.target);
        }).children("span").each(function () {
            loadFeeds(this);
        });
    
});
