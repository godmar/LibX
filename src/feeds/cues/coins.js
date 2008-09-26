if (libxEnv.openUrlResolver && libxEnv.options.supportcoins) {
    var coinsHandler = function(doc, span, query) {
        var openUrlResolver = libxEnv.openUrlResolver;
        var openurl = openUrlResolver.completeOpenURL(query);
        span.appendChild(libxEnv.makeLink(doc, 
                                          libxEnv.getProperty("openurllookup.label", 
                                                             [openUrlResolver.name]), 
                                          openurl, 
                                          openUrlResolver));
    };

    if (libxEnv.openUrlResolver.version != "1.0") {
        libxEnv.coins.handlers_v0_1.push(coinsHandler);
    } else {
        libxEnv.coins.handlers.push(coinsHandler);
    }
}

if (libxEnv.options.supportcoins) {
    /* MIT doesn't want coins on mit.worldcat.org --- exclude this site for now
     * XXX find better solution.
     */
    var exclude = [ /mit\.worldcat\.org/, 
                    /lens\.lib\.uchicago\.edu/ 
                  ];

    new libxEnv.doforurls.DoForURL(/.+/, 
        function (doc) {
            if (libxEnv.coins.handlers_v0_1.length > 0) {
                libxEnv.coins.handleCoins(doc, libxEnv.coins.handlers_v0_1, false);
            }
        }, exclude, "coins0.1");

    new libxEnv.doforurls.DoForURL(/.+/, 
        function (doc) {
            if (libxEnv.coins.handlers.length > 0) {
                libxEnv.coins.handleCoins(doc, libxEnv.coins.handlers, true);
            }
        }, exclude, "coins1.0");
}
