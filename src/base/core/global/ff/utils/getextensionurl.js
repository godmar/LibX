
/**
 * Get the absolute extension URL for a path.
 *
 * @param {String} path  the relative path of the resource
 * @returns {String} the absolute extension URL for the resource
 */
libx.utils.getExtensionURL = function (path) {
    return "chrome://libx/content/" + path;
};

