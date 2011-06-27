
// BRN: limit this to run only on libapp builder
if (typeof jQuery != "undefined") {
    
jQuery(function () {

    var $ = jQuery;

    // attach handler to cache clear button
    $('#clearCacheButton').live('click', function() {
    
        // show success button
        var $this = $(this);
        var $success = $('<button style="font-size: 0.8em; font-weight: bold; color: green;" disabled="disabled">Changes Downloaded!</button>');
        $this.replaceWith($success);
        setTimeout(function () {
            $success.replaceWith($this);
        }, 2000);
    
        libxTemp.sendRequest({
            type: "clearCache"
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
            libx.libapp.loadPackage(tempUrl);
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
