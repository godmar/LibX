
// BRN: this file just wraps around libx.libapp.Sandbox now,
// so we can probably remove it

/**
 * Load a script.
 *
 * @function
 * @param {String} url          URL of script (used for debugging)
 * @param {String} scriptStr    the script string to evaluate
 * @param {Object} globalScope  used as the global object in the execution
 *                              context
 * @param {Object} window       if supplied, specifies the security principal
 *                              (firefox only)
 */
libx.bootstrap.loadSubScript = (function() {
    
    var systemPrincipal = Cc["@mozilla.org/systemprincipal;1"] 
                             .createInstance(Ci.nsIPrincipal); 
    
    return function (url, scriptStr, globalScope, window) {
    
        var win;
        if (window)
            win = window;
        else
            win = systemPrincipal;
    
        libx.log.write("loading (" + url + ")", "bootstrap");
        
        var sbox = new libx.libapp.Sandbox(win, globalScope);
        sbox.evaluate(scriptStr, url);
        libx.log.write("done loading (" + url + ")");
    };
    
}) ();
