
libx.extension.addListener("clearCache", function (request, sender, sendResponse) {

    // clear the object cache
    libx.storage.metacacheStore.clear();
    libx.storage.cacheStore.clear();
    
    sendResponse({});

});
