
libxTemp.addListener(function(request, sender, sendResponse) {
    
    if(request.type == "pageEdition") {
        
        try {
            var meta = document.getElementsByTagName("meta");
            for (var i = 0; i < meta.length; i++) {
                if (meta[i].getAttribute('name') == "libxeditioninfo") {
                    var content = meta[i].getAttribute('content');
                    var m = content.match(/^(.*?)(\.(\d+))?;([0-9\.]+)$/);
                    if (m) {
                        var edition = m[1];
                        var revision = m[3] || "live";
                        var version = m[4];
                        libx.log.write("Sensing: edition=" + edition 
                                    + " revision=" + revision);
                        sendResponse({
                            edition: edition,
                            revision: revision,
                            version: version
                        });
                        break;
                    }
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