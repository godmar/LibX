
/**
 * Returns a Window object for the primary content window.
 *
 * @return Window object for content window
 */
libx.ui.getCurrentWindowContent = function() {
    return window;
};

(function () {
    
    var currFunc = 0;
    var funcArray = [];

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
                        return { _function_index: currFunc++ };
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
        if (request.type != "magicImportFunction")
            return;
            
        var funcObj = funcArray[request.index];
        funcObj.func.apply(funcObj.thisRef, request.args);
    });
    
}) ();
