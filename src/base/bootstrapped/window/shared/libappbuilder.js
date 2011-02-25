
// BRN: limit this to run only on libapp builder
if (typeof jQuery != "undefined") {
    
$(function () {

    // attach handler to cache clear button
    $('#clearCacheButton').live('click', function() {
        libxTemp.sendRequest({
            type: "clearCache"
        }, function (response) {
            alert("got " + response);
        });
    });

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
    
}
