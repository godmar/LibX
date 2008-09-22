if (libxEnv.openUrlResolver && libxEnv.options.supportcoins) {
    /* MIT doesn't want coins on mit.worldcat.org --- exclude this site for now
     * XXX find better solution.
     */
    var exclude = [ /mit\.worldcat\.org/, 
                    /lens\.lib\.uchicago\.edu/ 
                  ];

    new libxEnv.doforurls.DoForURL(/.+/, 
                 function (doc) {
                     libxEnv.handleCoins(doc, libxEnv.openUrlResolver) 
                 }, exclude);
}
