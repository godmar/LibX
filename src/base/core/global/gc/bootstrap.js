
libx.bootstrap.loadSubScript = function (url, scriptData, globalScope) {
    
    libx.log.write("loading (" + url + ")");

    (function() {
        // NOTE: Previously, <script>s were used to load bootstrapped scripts.
        // However, they are not guaranteed to be loaded synchronously, which
        // we require.  For now, we work around this simply by using eval().

        // // window so that injected scripts can access these properties
        // for(var i in globalScope)
        //     window[i] = globalScope[i];

        // // inject script element into background page
        // var script = document.createElement('script');
        // script.src = 'data:' + metadata.mimeType + ';base64,' + libx.utils.binary.binary2Base64(scriptData);
        // document.head.appendChild(script);

        // with block works nicely here, but we get no line numbers with eval()
        // errors
        with (globalScope) {
            eval(scriptData);
        }

    }) ();
    
};
