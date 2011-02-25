
libx.extension.addListener("clearCache", function (request, sender, sendResponse) {

    // clear the object cache
    var cache = new libx.storage.Store('cache');
    var metacache = new libx.storage.Store('metacache');
    metacache.clear();
    cache.clear();
    
    sendResponse({});

});