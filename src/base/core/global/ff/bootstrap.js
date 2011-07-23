
// BRN: this file just wraps around libx.libapp.Sandbox now,
// so we can probably remove it

/**
 * Load a script in Firefox via jssubscript-loader.
 *
 * @param {metadata.originURL} originURL Script URL
 * @param {metadata.chromeURL} chromeURL internal chrome URL
 */
libx.bootstrap.loadSubScript = (function() {
    
    var systemPrincipal = Cc["@mozilla.org/systemprincipal;1"] 
                             .createInstance(Ci.nsIPrincipal); 
    
    return function (url, scriptStr, metadata, globalScope, window) {
    
        var win;
        if(window)
            win = window;
        else
            win = systemPrincipal;
    
        libx.log.write("loading (" + url + ")", "bootstrap");
        
        var sbox = new libx.libapp.Sandbox(win, globalScope);
        sbox.evaluate(scriptStr, url);
        libx.log.write("done loading (" + url + ")");
    };
    
}) ();
