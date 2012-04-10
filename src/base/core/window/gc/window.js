
libx.ui.getCurrentWindowContent = function() {
    return window;
};

// namespace for importing magicImport functions without having to replace the originals
var imported = {};

(function () {
    
    // array of function references.  each time a callback function is sent to the
    // background page using magicImport, the callback is added to this array so it can
    // be referenced and executed later.
    var funcArray = [];

    // unique function ID sent for each RMI callback stub.  when the background page
    // wants to call the callback, it sends this same ID back to the content script.  the
    // content script then locates the function in the funcArray to execute the callback
    // function.
    var currFunc = 0;

    // object containing all of the listeners that have been registered for this window.
    // listeners are registered using libxTemp.addListener().
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

    // BRN: figure out a way to document this with jsdoc
    libxTemp = {
            
        addListener: function (type, listener) {
            listeners[type] = listener;
        },
        
        sendRequest: function (request, callback) {
            chrome.extension.sendRequest.apply(this, arguments);
        },
        
        // Chrome-only logic for RMI.  the main libx object resides in a
        // different process (the background page), so we use magicImport as a
        // generic means to expose the API to the content script.
        // the options object can have the following properties:
        //   namespace: where to create the imported function.  if not given,
        //     the global window object is used.
        //   returns: boolean that indicates whether the function synchronously 
        //     returns a value.  if true, an additional callback argument must be
        //     given to this imported function (this must be the last argument
        //     given).  this callback must accept exactly one argument - this
        //     will be the return value.
        //       example:
        //         libxTemp.magicImport("libx.importedFunction", { returns: true });
        //         ...
        //         libx.importedFunction(arg1, arg2, function (returnVal) {
        //           alert("importedFunction returned " + returnVal);
        //         });
        magicImport: function(str, options) {
        
            if (typeof(options) == "undefined")
                options = [];

            // given the function name string, attach a function stub to the
            // namespace
            var chain = str.split('.');
            var obj = (options.namespace ? options.namespace : window);
            for (var i = 0; i < chain.length-1; i++) {
                if (typeof(obj[chain[i]]) == "undefined")
                    obj[chain[i]] = {};
                obj = obj[chain[i]];
            }
            
            // create the function stub
            obj[chain[chain.length-1]] = function() {
                
                var timestamp = new Date().getTime();

                function serialize(obj, thisRef) {
                
                    // replace callback functions with callback stubs.
                    // functions are converted to an object with the following
                    // form: { _function_index: <ID> }.  when the server wants
                    // to execute this function, it sends the ID back to the
                    // content script.  also see comments for funcArray and
                    // currFunc above.
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

    // we can't send actual XML documents, so we pass them as strings.  objects
    // representing "scrubbed" XML documents are of the form: { _xml:
    // <stringified XML> }.  thus, if the arguments list contains an object
    // with the _xml property, unscrub this object and replace it with the
    // actual XML document from the string.
    function unscrub(args) {
        for (var i = 0; i < args.length; i++) {
            if (args[i] && args[i]._xml)
                args[i] = libx.utils.xml.loadXMLDocumentFromString(args[i]._xml);
        }
    }

    // the background page sends a "magicImportFunction" message whenever it
    // executes callbacks that exist on the content script side.  these
    // messages must contain the ID of the function being called (see comments
    // for currFunc and funcArray above); this ID is returned as the "index"
    // property of the request.
    libxTemp.addListener("magicImportFunction", function (request, sender, sendResponse) {
        var funcObj = funcArray[request.index];

        // if the user goes to a new page, the background page may still try to
        // execute callbacks for previously visited pages.  to handle this, we
        // pass a timestamp with each callback stub so we don't execute stale
        // callbacks.
        //BRN: we can probably use the timestamp itself as the ID
        if (funcObj && funcObj.timestamp == request.timestamp) {
            unscrub(request.args);
            funcObj.func.apply(funcObj.thisRef, request.args);
        }

        sendResponse();
    });

    libxTemp.magicImport('libx.utils.browserprefs.setBoolPref');
    libxTemp.magicImport('libx.utils.browserprefs.setStringPref');
    libxTemp.magicImport('libx.utils.browserprefs.setIntPref');
    libxTemp.magicImport('libx.preferences.loadUserPrefs', { namespace: imported });
    libxTemp.magicImport('libx.libapp.getPackages', { returns: true, namespace: imported });
    libxTemp.magicImport('libx.libapp.addTempPackage');
    libxTemp.magicImport('libx.libapp.clearTempPackages');
    libxTemp.magicImport('libx.libapp.reloadPackages');
    libxTemp.magicImport('libx.libapp.getOverridden');
    libxTemp.magicImport('libx.storage.prefsStore.getItem');
    libxTemp.magicImport('libx.storage.prefsStore.setItem');
    libxTemp.magicImport('libx.storage.prefsStore.removeItem');
    libxTemp.magicImport('libx.storage.prefsStore.clear');
    libxTemp.magicImport('libx.storage.prefsStore.find');
    libxTemp.magicImport('libx.analytics.bd.push');

    // because the object cache and memory cache are used frequently,
    // magicImporting them can consume a lot of memory.  this is because each
    // success/error/complete callback sent with each get() request are stored
    // in the funcArray - meaning the functions never get garbage collected.
    // thus, we handle these as special cases.
    (function () {

        // chrome's request/response model allows only one response per
        // request.  since the success/error/complete callbacks are executed
        // separately at different times, we must batch them all together into
        // a single response.  here, we fire each individual
        // success/error/complete callback in the batched response.
        function fireCallbacks(request, response, doUnscrub) {
            ['success', 'error', 'complete'].forEach(function (callback) {
                if (!response[callback])
                    return;
                doUnscrub && unscrub(response[callback]);
                request[callback] && request[callback].apply(request, response[callback]);
            });
        }

        // a per-page cache of object cache requests.  sending huge amounts of
        // data via messaging can be expensive, so we cache responses to reduce
        // the load.  specifically, this is useful for the subscribed feed XML files.
        var ocCache = {};

        libx.cache = {
            // we can't pass the actual validator function via RMI, so we
            // send the name of the validator we want to use and look it up
            // on the server side.
            validators: {
                config: 'config',
                bootstrapped: 'bootstrapped',
                feed: 'feed',
                image: 'image',
                preference: 'preference'
            },
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
                        else {
                            // if we fire multiple requests for the same resource in a
                            // short timespan, only send one message.  when the
                            // response is received, send the response to all queued
                            // requests.
                            cacheEntry.queue.push(request);
                        }
                    } else {
                        cacheEntry = ocCache[request.url] = { success: false, queue: [] };
                        chrome.extension.sendRequest({ type: "objectCache", args: request }, function (response) {

                            // if the request succeeded, add the response to
                            // the local cache; future requests for this
                            // resource will use the cached response.
                            if (response.success) {
                                cacheEntry.success = true;
                                cacheEntry.value = response;
                            } else {
                                ocCache[request.url] = null;
                            }
                            fireCallbacks(request, response, true);

                            // send the response to all queued requests
                            while (cacheEntry.queue.length) {
                                var queued = cacheEntry.queue.pop();
                                fireCallbacks(queued, response, false);
                            }
                        });
                    }
                }
            }
        };
    }) ();

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
                            libx.utils.getBootstrapURL("bootstrapcontentscript.js") )
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
    
    libx.libappdata = {};

}) ();
