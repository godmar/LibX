
/**
 * Load a script in Firefox via jssubscript-loader.
 *
 * @param {metadata.originURL} originURL Script URL
 * @param {metadata.chromeURL} chromeURL internal chrome URL
 */
libx.bootstrap.loadSubScript = function (metadata, globalScope)
{
    try {
        libx.log.write("loading (" + metadata.originURL + ") from (" + metadata.chromeURL + ")", "bootstrap");

        $.getScript(metadata.chromeURL);
        libx.log.write("done loading (" + metadata.originURL + ")");

    } catch (e) {
        var where = e.location || (e.fileName + ":" + e.lineNumber);
        libx.log.write( "error loading " + metadata.originURL + " -> " + e + " " + where);
    }
}
