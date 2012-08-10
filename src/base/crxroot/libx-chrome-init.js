/* To be included last in libx.html background page, moved here because
 * new security policy does not allow inline javascript code.
 */
try {
    libx.initialize(true);
} catch (er) {
    console.log("Error in libx.initialize(): " + er);
}

// show edition icon after config is loaded
// BRN: factor this out between browsers
libx.events.addListener("EditionConfigurationLoaded", {
    onEditionConfigurationLoaded: function() {
        libx.utils.getEditionResource({
            url: libx.edition.options.icon,
            success: function (dataUri) {
                libx.ui.setIcon(dataUri);
                /*Track everytime edition loads*/
                libx.analytics.track({activity:"activeEdition"});
                /*Track firstRun of extension. LibX analytics
                  checks if firstRun cookie is set already, if not
                  then tracks it!
                */
                libx.analytics.track({activity:"firstRun"});
            }
        });
    }
    
});

var configUrl = libx.utils.browserprefs.getStringPref('libx.edition.configurl', null);
if (configUrl) {
    // load config if user has one set
    libx.loadConfig(configUrl);
}

// load edition from cookie if it exists
var cookieData = {
    url: '$crxlocation$gc',
    name: 'libxedition'
};
chrome.cookies.get(cookieData, function (cookie) {
    var edition = cookie && cookie.value;
    if (!edition)
        return;
    chrome.cookies.remove(cookieData);

    var path = libx.utils.getEditionPath(edition);
    var configUrl = 'http:/libx.org/editions/' + path + '/config.xml';
    libx.utils.browserprefs.setStringPref('libx.edition.configurl', configUrl);
    libx.loadConfig(configUrl);
});
    
function scrub(args) {
    args = [].slice.call(args);
    for (var i = 0; i < args.length; i++) {
        if (args[i] instanceof Object && args[i].xmlVersion)
            args[i] = { _xml: libx.utils.xml.convertXMLDocumentToString(args[i]) };
        try {
            libx.utils.json.stringify(args[i]);
        } catch (e) {
            args[i] = {};
        }
    }
    return args;
}

function cacheRequest(cache, args, sendResponse) {

    if (args.validator)
        args.validator = libx.cache.validators[args.validator];

    var result = {};
    args.success = function () {
        result.success = scrub(arguments);
    };
    args.error = function () {
        result.error = scrub(arguments);
    };
    args.complete = function () {
        result.complete = scrub(arguments);
        sendResponse(result);
    };
    cache.get.call(cache, args);
}

libx.background.addListener("memoryCache", function (request, sender, sendResponse) {
    cacheRequest(libx.cache.defaultMemoryCache, request.args, sendResponse);
});

libx.background.addListener("objectCache", function (request, sender, sendResponse) {
    cacheRequest(libx.cache.defaultObjectCache, request.args, sendResponse);
});

libx.background.addListener("browserPrefs", function (request, sender, sendResponse) {
    // the localStorage should only contain browserprefs
    sendResponse({ prefs: localStorage });
});

libx.background.addListener("magicImport", function (request, sender, sendResponse) {
        
    function unserialize(obj) {
    
        if (typeof(obj) != "object" || obj == null)
            return obj;
            
        if (typeof(obj._function_index) != "undefined") {
            return function () {
                var args = scrub(arguments);
                chrome.tabs.sendMessage(sender.tab.id, {
                    type: "magicImportFunction",
                    index: obj._function_index,
                    args: args,
                    timestamp: request.timestamp
                });
            };
        }
            
        var newObj = (obj instanceof Array) ? [] : {};
        for (var i in obj)
            newObj[i] = unserialize(obj[i]);
        
        return newObj;
    }
        
    var args = unserialize(request.requestObj);
    
    var obj = window;
    for (var i = 0; i < request.func.length-1; i++)
        obj = obj[request.func[i]];
    
    var prop = obj[request.func[request.func.length-1]];
    if (typeof(prop) == "function") {
        var result = prop.apply(obj, args);
        result = scrub([result]);
        sendResponse({ result: result[0] });
    } else {
        sendResponse({ result: prop });
    }
        
});
