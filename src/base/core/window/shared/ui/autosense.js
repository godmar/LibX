
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
