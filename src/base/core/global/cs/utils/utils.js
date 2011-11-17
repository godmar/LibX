/**
 * Get the bootstrap URL for a path. [client-side implementation]
 *
 * @param {String} path  the relative path of the resource
 * @returns {String} the absolute bootstrap URL for the resource
 */
libx.utils.getBootstrapURL = function (path) {
    return libx.cs.baseurl + "src/base/bootstrapped/" + path;
};

libx.utils.getExtensionURL = function (path) {
    return libx.cs.baseurl + "src/base/" + path;
}
