
var imported = {};

libxTemp.magicImport('localStorage', { returns: true, namespace: imported });
libxTemp.magicImport('libx.utils.browserprefs.setBoolPref');
libxTemp.magicImport('libx.utils.browserprefs.setStringPref');
libxTemp.magicImport('libx.utils.browserprefs.setIntPref');
libxTemp.magicImport('libx.cache.defaultObjectCache.get');
libxTemp.magicImport('libx.cache.defaultMemoryCache.get');
libxTemp.magicImport('libx.libapp.loadedLibapps', { returns: true, namespace: imported });


libx.libappdata = {};

imported.localStorage(function(result) {
    libx.utils.browserprefs.setStore(result);
    var configUrl = libx.utils.browserprefs.getStringPref('libx.edition.configurl', null);
    libx.loadConfig(configUrl);
});

libx.events.addListener("EditionConfigurationLoaded", {
    onEditionConfigurationLoaded: function() {
        /* Parse remote URL. Temporary implementation until config.xml is
         * updated to not use chrome:// URLs. */
        var iconUrl = libx.utils.browserprefs.getStringPref('libx.edition.configurl', null)
            .replace('/config.xml', '') + libx.edition.options.icon.replace('chrome://libx/skin', '');
        libx.cache.defaultObjectCache.get({
            type: 'GET',
            url: iconUrl,
            serverMIMEType: 'text/plain; charset=x-user-defined',
            fetchDataUri: true,
            success: function(data) {
                libx.edition.options.icon = data;
            }
        });
        
        // Load all URLs marked as @type = 'bootwindow' in configuration
        var bootWindowUrls = libx.edition.localizationfeeds.bootwindow;
        if (bootWindowUrls.length == 0) {
            // Fall back to local preference
            bootWindowUrls.push({ url:
                libx.utils.browserprefs.getStringPref("libx.bootstrap.window.url", 
                    "http://libx.org/libx-new/src/base/bootstrapped/bootstrapwindow.js") });
        }

        var windowBootStrapper = new libx.bootstrap.BootStrapper();
        
        if (!libx.initialize.globalBootStrapper.hasFinished) {
            /* Global boot strapping still in progress.  Delay bootstrapping
             * of window scripts until this is done. */
            var blockUntilGlobalBootstrapDone = new libx.utils.collections.EmptyActivity();
            windowBootStrapper.scriptQueue.scheduleFirst(blockUntilGlobalBootstrapDone);
            
            libx.events.addListener("GlobalBootstrapDone", {
                onGlobalBootstrapDone: function (globalBootstrapDoneEvent) {
                    blockUntilGlobalBootstrapDone.markReady();
                }
            });
        }
        
        var blockUntilLoadedLibappsReceived = new libx.utils.collections.EmptyActivity();
        windowBootStrapper.scriptQueue.scheduleFirst(blockUntilLoadedLibappsReceived);

        imported.libx.libapp.loadedLibapps(function(result) {
            libx.libapp.loadedLibapps = result;
            blockUntilLoadedLibappsReceived.markReady();
        });
        
        for (var i = 0; i < bootWindowUrls.length; i++)
            windowBootStrapper.loadScript(bootWindowUrls[i].url, true, {
                libx: libx,
                window: window,
            });
        
    }
});

