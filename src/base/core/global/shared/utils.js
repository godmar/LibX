
/**
 * Get the bootstrap URL for a path.
 *
 * @param {String} path  the relative path of the resource
 * @returns {String} the absolute bootstrap URL for the resource
 */
libx.utils.getBootstrapURL = function (path) {
    /*return "$bootstrapURL$" + path;*/
    return libx.cs.baseurl + "src/base/bootstrapped/" + path;
};

/**
 * Fetch a remote resource from a local URL.  Temporary solution until chrome://
 * urls are replaced in edition configurations.
 * This function assumes all resources being fetched are images.
 *
 * @param {Object} paramObj  parameter object
 * @config {String} url      URL of local chrome:// resource that will be translated and fetched
 * @config {Function(text)}  success  callback function with one argument,
 *                           which is the base 64 text string of image
 * @config {Function()}      error  callback function on error
 * @config {Function()}      complete  callback function on completion
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
        validator: libx.cache.validators.image,
        success: paramObj.success,
        error: paramObj.error,
        complete: paramObj.complete
    });
};


/**
 * Returns the URL to a given edition's directory.
 * @param {String} editionId  ID of the edition
 * @returns {String} URL of the edition
 */
libx.utils.getEditionPath = function (editionId) {
    if (editionId[0] >= 'a' && editionId[0] <= 'z')
        return editionId;
    return editionId.substr(0, 2) + "/" + editionId.substr(2, 2) + "/" + editionId;
};
