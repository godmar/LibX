
/**
 * Returns a Window object for the primary content window.
 *
 * @return Window object for content window
 */

libx.ui.getCurrentWindowContent = function() {
    return window;
};

var imported = {};

(function () {
    
    var currFunc = 0;
    var funcArray = [];
    var timestamp = new Date().getTime();

    libxTemp = {
            
        addListener: function(listener) {
            chrome.extension.onRequest.addListener(listener);
        },
        
        magicImport: function(str, options) {
        
            if (typeof(options) == "undefined")
                options = [];
            var chain = str.split('.');
            var obj = (options.namespace ? options.namespace : window);
            for (var i = 0; i < chain.length-1; i++) {
                if (typeof(obj[chain[i]]) == "undefined")
                    obj[chain[i]] = {};
                obj = obj[chain[i]];
            }
            
            obj[chain[chain.length-1]] = function() {
                
                function serialize(obj, thisRef) {
                
                    if (typeof(obj) == "function") {
                        funcArray[currFunc] = {
                            func: obj,
                            thisRef: thisRef
                        };
                        return {
                            _function_index: currFunc++,
                            timestamp: timestamp
                        };
                    }
                
                    if (typeof(obj) != "object")
                        return obj;
                        
                    var newObj = (obj instanceof Array) ? [] : {};
                    for (var i in obj)
                        newObj[i] = serialize(obj[i], obj);
                    return newObj;
                    
                }
                
                var argsArray = [].slice.call(arguments);
                var returnFunc = null;
                if (options.returns)
                    returnFunc = argsArray.pop();
                var requestObj = serialize(argsArray, window);
                
                var request = {
                    type: "magicImport",
                    func: chain,
                    requestObj: requestObj
                };
                
                chrome.extension.sendRequest(request, function (response) {
                    if (options.returns)
                        returnFunc(response.result);
                });
            };
        }

    };
    
    chrome.extension.onRequest.addListener(function(request) {
        if (request.type != "magicImportFunction" || request.timestamp != timestamp)
            return;
            
        var funcObj = funcArray[request.index];
        
        // unserialize XML documents
        for (var i = 0; i < request.args.length; i++) {
            if (request.args[i] != null && request.args[i]._xml)
                request.args[i] = libx.utils.xml.loadXMLDocumentFromString(request.args[i]._xml);
        }
        
        funcObj.func.apply(funcObj.thisRef, request.args);
    });

    /* prepare import of proxies */
    libxTemp.magicImport('localStorage', { returns: true, namespace: imported });
    libxTemp.magicImport('localStorage.getItem', { returns: true, namespace: imported });
    libxTemp.magicImport('localStorage.setItem', { namespace: imported });
    libxTemp.magicImport('libx.utils.browserprefs.setBoolPref');
    libxTemp.magicImport('libx.utils.browserprefs.setStringPref');
    libxTemp.magicImport('libx.utils.browserprefs.setIntPref');
    libxTemp.magicImport('libx.cache.defaultObjectCache.get');
    libxTemp.magicImport('libx.cache.defaultMemoryCache.get');
    libxTemp.magicImport('libx.preferences.initialize', { returns: true, namespace: imported });

    libx.libappdata = {};

    // receive entire localStorage as 'result' from background page (this is likely too expensive.)
    imported.localStorage(function(result) {
        libx.utils.browserprefs.setStore(result);
        libx.initialize(true, false);
        var configUrl = libx.utils.browserprefs.getStringPref('libx.edition.configurl', null);
        libx.loadConfig(configUrl);
    });

    libx.events.addListener("EditionConfigurationLoaded", {
        onEditionConfigurationLoaded: function() {
            
            // Load all URLs marked as @type = 'bootwindow' in configuration
            var bootWindowUrls = libx.edition.localizationfeeds.bootwindow;
            if (bootWindowUrls.length == 0) {
                // Fall back to local preference
                bootWindowUrls.push({
                    url: libx.utils.browserprefs.getStringPref( "libx.bootstrap.window.url",
                            libx.locale.getBootstrapURL("bootstrapwindow.js") )
                });
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
            
            for (var i = 0; i < bootWindowUrls.length; i++)
                windowBootStrapper.loadScript(bootWindowUrls[i].url, true, {
                    libx: libx,
                    window: window,
                });
            
        }
    });

    // Aside from saving preferences to the background page localStorage, the
    // libx.prefs object in the background page should also be refreshed to reflect
    // the newly saved preferences.  This is done by reinitializing the prefs.
    var savePrefs = libx.preferences.save;
    libx.preferences.save = function () {
        savePrefs.apply(libx.preferences);
        // XXX: we aren't using a callback for the above call (which will do an async
        // request through libx.storage), so we are assuming it has executed already.
        // is this a safe assumption?
        imported.libx.preferences.initialize();
    }
    
    // set up the cross-browser sandbox wrapper
    libx.libapp.Sandbox = libx.core.Class.create({
        initialize: function (win, globalScope) {
        },
        evaluate: function (code) {
            return eval(code);
        }
    });
    
}) ();
