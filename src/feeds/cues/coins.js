if (libxEnv.openUrlResolver && libxEnv.options.supportcoins) {
    new libxEnv.doforurls.DoForURL(/.+/, 
                 function (doc) {
                     libxEnv.handleCoins(doc, libxEnv.openUrlResolver) 
                 });
}
