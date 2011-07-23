
/**
 * Load a script in Google Chrome.
 *
 * @param {metadata.originURL} originURL Script URL
 * @param {metadata.chromeURL} chromeURL internal chrome URL
 */
libx.bootstrap.loadSubScript = function (url, scriptData, metadata, globalScope) {
    
    libx.log.write("loading (" + url + ")");

    (function() {
        // make all properties of globalScope visible to the background page
        // window so that injected scripts can access these properties
        for(var i in globalScope)
            window[i] = globalScope[i];
        
        eval(scriptData);
    }) ();
    
};
