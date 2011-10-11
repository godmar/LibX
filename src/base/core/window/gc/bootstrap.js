
libx.bootstrap.loadSubScript = function (url, scriptData, globalScope) {
    
    libx.log.write("loading (" + url + ")");

    (function() {
        // make all properties of globalScope visible to the background page
        // window so that injected scripts can access these properties
        for(var i in globalScope)
            window[i] = globalScope[i];
        
        eval(scriptData);
    }) ();
    
};
