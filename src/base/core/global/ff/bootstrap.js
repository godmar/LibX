
libx.bootstrap.fetchDataUri = false;

/**
 * Load a script in Firefox via jssubscript-loader.
 *
 * @param {metadata.originURL} originURL Script URL
 * @param {metadata.chromeURL} chromeURL internal chrome URL
 */
libx.bootstrap.loadSubScript = (function() {
    
    var systemPrincipal = Cc["@mozilla.org/systemprincipal;1"] 
                             .createInstance(Ci.nsIPrincipal); 
    
    return function (scriptStr, metadata, globalScope) {
        libx.log.write("loading (" + metadata.originURL + ")", "bootstrap");
        
        var sbox = new libx.libapp.Sandbox(systemPrincipal, globalScope);
        sbox.evaluate(scriptStr, metadata.originURL);
        libx.log.write("done loading (" + metadata.originURL + ")");
    };
    
}) ();
