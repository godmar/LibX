
/**
 * Fetch a remote resource from a local URL.  Temporary solution until chrome://
 * urls are replaced in edition configurations.
 *
 * @param {Object} an object containing the same properties accepted by
 *          libx.cache.ObjectCache.get().  The url specified must point to a
 *          local resource that will be translated and fetched.
 */
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

    libx.cache.defaultObjectCache.get({
        url: url,
        dataType: "text",
        validator: libx.cache.defaultMemoryCache.validators.image,
        success: paramObj.success,
        error: paramObj.error,
        complete: paramObj.complete
    });
};

