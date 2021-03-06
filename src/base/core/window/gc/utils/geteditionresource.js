
libx.utils.getEditionResource = function(paramObj) {
    var chromePrefix = 'chrome://libx/skin';

    // if the chrome URL has already been replaced with its data URI,
    // execute the callbacks with the existing value and return
    if (paramObj.url.substr(0, chromePrefix.length) != chromePrefix) {
        paramObj.success && paramObj.success(paramObj.url);
        paramObj.complete && paramObj.complete();
        return;
    }

    var url = libx.utils.browserprefs.getStringPref('libx.edition.configurl', '')
        .replace('/config.xml', '') + paramObj.url.replace(chromePrefix, '');
    var inCache = false;

    // use the image's data URI if it is in the cache.
    // if not, use the image's URL
    libx.cache.defaultObjectCache.get({
        validator: libx.cache.validators.image,
        url: url,
        cacheOnly: true,
        success: function () {
            inCache = true;
            paramObj.success && paramObj.success(arguments);
        },
        error: paramObj.error,
        complete: function () {
            if (!inCache)
                paramObj.success && paramObj.success(url);
            paramObj.complete && paramObj.complete(arguments);
        }
    });

};

