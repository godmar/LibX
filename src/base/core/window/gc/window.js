
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

    // converts XML strings to documents
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
    libxTemp.magicImport('libx.utils.browserprefs.setBoolPref');
    libxTemp.magicImport('libx.utils.browserprefs.setStringPref');
    libxTemp.magicImport('libx.utils.browserprefs.setIntPref');
    libxTemp.magicImport('libx.preferences.loadUserPrefs', { namespace: imported });
    libxTemp.magicImport('libx.libapp.getPackages', { returns: true, namespace: imported });
    libxTemp.magicImport('libx.libapp.addTempPackage');
    libxTemp.magicImport('libx.libapp.clearTempPackages');
    libxTemp.magicImport('libx.libapp.getOverridden');
    libxTemp.magicImport('libx.storage.prefsStore.getItem');
    libxTemp.magicImport('libx.storage.prefsStore.setItem');
    libxTemp.magicImport('libx.storage.prefsStore.removeItem');
    libxTemp.magicImport('libx.storage.prefsStore.clear');
    libxTemp.magicImport('libx.storage.prefsStore.find');

    libx.libappdata = {};
    function fireCallbacks(request, response, doUnscrub) {
        ['success', 'error', 'complete'].forEach(function (callback) {
            if (!response[callback])
                return;
            doUnscrub && unscrub(response[callback]);
            request[callback] && request[callback].apply(request, response[callback]);
        });
    }

    // a per-page cache of object cache requests
    var ocCache = {};

    libx.cache = {
        defaultMemoryCache: {
            get: function (request) {
                chrome.extension.sendRequest({ type: "memoryCache", args: request }, function (response) {
                    fireCallbacks(request, response, true);
                });
            }
        },
        defaultObjectCache: {
            get: function (request) {
                var cacheEntry = ocCache[request.url];
                if (cacheEntry) {
                    if (cacheEntry.success)
                        fireCallbacks(request, cacheEntry.value, false);
                    else
                        cacheEntry.queue.push(request);
                } else {
                    cacheEntry = ocCache[request.url] = { success: false, queue: [] };
                    chrome.extension.sendRequest({ type: "objectCache", args: request }, function (response) {
                        fireCallbacks(request, response, true);
                        if (response.success) {
                            cacheEntry.success = true
                            cacheEntry.value = response;
                        } else {
                            ocCache[request.url] = null;
                        }
                        while (cacheEntry.queue.length) {
                            var queued = cacheEntry.queue.pop();
                            fireCallbacks(queued, response, false);
                        }
                    });
                }
            },
            validators: {
                config: 'config',
                bootstrapped: 'bootstrapped',
                feed: 'feed',
                image: 'image',
                preference: 'preference'
            }
        }
    };

    // get browserprefs from background page
    chrome.extension.sendRequest({ type: "browserPrefs" }, function (result) {
        libx.utils.browserprefs.setStore(result.prefs);
        libx.initialize(false);
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
                    url: libx.utils.browserprefs.getStringPref( "libx.bootstrap.contentscript.url",
                            libx.locale.getBootstrapURL("bootstrapcontentscript.js") )
                });
            }

            var windowBootStrapper = new libx.bootstrap.BootStrapper();
            
            var blockUntilEnabledPackagesReceived = new libx.utils.collections.EmptyActivity();
            windowBootStrapper.scriptQueue.scheduleFirst(blockUntilEnabledPackagesReceived);
            
            imported.libx.libapp.getPackages(true, function (enabledPackages) {
                libx.libapp.getPackages = function (enabledOnly) {
                    if (!enabledOnly)
                        libx.log.write('libx.libapp.getPackages(false) not supported in content script');
                    return enabledPackages
                };
                blockUntilEnabledPackagesReceived.markReady();
            });
            
            for (var i = 0; i < bootWindowUrls.length; i++)
                windowBootStrapper.loadScript(bootWindowUrls[i].url, {
                    libx: libx
                });
            
        }
    });

    // Aside from saving preferences to the background page localStorage, the
    // libx.prefs object in the background page should also be refreshed to reflect
    // the newly saved preferences.
    var savePrefs = libx.preferences.save;
    libx.preferences.save = function () {
        savePrefs.apply(libx.preferences);
        // we aren't using a callback for the above call (which will do an async
        // request through libx.storage), and we are assuming it has executed already.
        imported.libx.preferences.loadUserPrefs();
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
