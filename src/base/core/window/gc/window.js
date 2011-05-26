
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
    var listeners = {};
    chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
        for (var i in listeners) {
            if (request.type == i) {
                listeners[i].apply(this, arguments);
                return;
            }
        }
        sendResponse();
    });

    libxTemp = {
            
        addListener: function (type, listener) {
            listeners[type] = listener;
        },
        
        sendRequest: function (request, callback) {
            chrome.extension.sendRequest.apply(this, arguments);
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
                
                var timestamp = new Date().getTime();

                function serialize(obj, thisRef) {
                
                    if (typeof(obj) == "function") {
                        funcArray[currFunc] = {
                            func: obj,
                            thisRef: thisRef,
                            timestamp: timestamp
                        };
                        return {
                            _function_index: currFunc++
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
                if (options.returns) {
                    returnFunc = argsArray.pop();
                    if (typeof returnFunc != "function")
                        libx.log.write("Error: in magicImport, callback expected for return value");
                }
                var requestObj = serialize(argsArray, window);
                
                var request = {
                    type: "magicImport",
                    func: chain,
                    requestObj: requestObj,
                    timestamp: timestamp
                };
                
                chrome.extension.sendRequest(request, function (response) {
                    if (options.returns)
                        returnFunc(response.result);
                });
            };
        }

    };

    function unscrub(args) {
        for (var i = 0; i < args.length; i++) {
            if (args[i] && args[i]._xml)
                args[i] = libx.utils.xml.loadXMLDocumentFromString(args[i]._xml);
        }
    }

    libxTemp.addListener("magicImportFunction", function (request, sender, sendResponse) {
        var funcObj = funcArray[request.index];

        // verify the timestamp matches to prevent receiving stale callbacks
        if (funcObj && funcObj.timestamp == request.timestamp) {
            unscrub(request.args);
            funcObj.func.apply(funcObj.thisRef, request.args);
        }

        sendResponse();
    });

    // prepare import of proxies
    libxTemp.magicImport('localStorage.getItem', { returns: true, namespace: imported });
    libxTemp.magicImport('localStorage.setItem', { namespace: imported });
    libxTemp.magicImport('libx.utils.browserprefs.setBoolPref');
    libxTemp.magicImport('libx.utils.browserprefs.setStringPref');
    libxTemp.magicImport('libx.utils.browserprefs.setIntPref');
    //libxTemp.magicImport('libx.cache.defaultObjectCache.get');
    //libxTemp.magicImport('libx.cache.defaultMemoryCache.get');
    libxTemp.magicImport('libx.preferences.initialize', { namespace: imported });
    libxTemp.magicImport('libx.libapp.loadLibapps');
    libxTemp.magicImport('libx.libapp.getEnabledPackages', { returns: true, namespace: imported } );
    libxTemp.magicImport('libx.libapp.addTempPackage');
    libxTemp.magicImport('libx.libapp.clearTempPackages');

    libx.libappdata = {};
    function fireCallbacks(request, response, doUnscrub) {
        for (var i in response) {
            if (doUnscrub)
                unscrub(response[i]);
            request[i] && request[i].apply(request, response[i]);
        }
    }

    libx.cache = {
        defaultMemoryCache: {
            get: function (request) {
                chrome.extension.sendRequest({ type: "memoryCache", args: request }, function (response) {
                    fireCallbacks(request, response, true);
                });
            }
        },
        defaultObjectCache: {
            // a per-page cache of object cache requests
            cache: {},
            get: function (request) {
                if (this.cache[request.url]) {
                    fireCallbacks(request, this.cache[args.url], false);
                } else {
                    chrome.extension.sendRequest({ type: "objectCache", args: request }, function (response) {
                        fireCallbacks(request, response, true);
                        this.cache[request.url] = response;
                    });
                }
            }
        }
    };

    // get browserprefs from background page
    chrome.extension.sendRequest({ type: "browserPrefs" }, function (result) {
        libx.utils.browserprefs.setStore(result.prefs);
        libx.initialize(true, false);
        var configUrl = libx.utils.browserprefs.getStringPref('libx.edition.configurl', null);
        if (configUrl != null)
            libx.loadConfig(configUrl);
    });

    libx.events.addListener("EditionConfigurationLoaded", {
        onEditionConfigurationLoaded: function () {
            
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
            
            var blockUntilEnabledPackagesReceived = new libx.utils.collections.EmptyActivity();
            windowBootStrapper.scriptQueue.scheduleFirst(blockUntilEnabledPackagesReceived);
            
            imported.libx.libapp.getEnabledPackages(function (packages) {
                libx.libapp.getEnabledPackages = function () { return packages };
                blockUntilEnabledPackagesReceived.markReady();
            });
            
            for (var i = 0; i < bootWindowUrls.length; i++)
                windowBootStrapper.loadScript(bootWindowUrls[i].url, true, {
                    libx: libx
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
