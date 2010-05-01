
/**
 * Load a script in Google Chrome via eval().
 *
 * @param {metadata.originURL} originURL Script URL
 * @param {metadata.chromeURL} chromeURL internal chrome URL
 */
libx.bootstrap.loadSubScript = function (metadata, globalScope)
{
    try {
        libx.log.write("loading (" + metadata.originURL + ") from (" + metadata.chromeURL + ")", "bootstrap");

        (function(bootStrapper) {
            eval(libx.io.getFileText(metadata.localPath));
        }) (globalScope.bootStrapper);
        
        libx.log.write("done loading (" + metadata.originURL + ")");

    } catch (e) {
        var where = e.location || (e.fileName + ":" + e.lineNumber);
        libx.log.write( "error loading " + metadata.originURL + " -> " + e + " " + where);
    }
}
