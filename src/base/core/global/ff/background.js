
(function () {

    var listeners = {};

    /**
     * Namespace for background-page specific functions.
     * In Firefox, the "background page" refers to the global LibX component.
     * Firefox currently does not require this message-based communication, but
     * we use it for API consistency in LibX.
     * Based partially on the Chrome API at: http://code.google.com/chrome/extensions/extension.html
     * @namespace
     */
    libx.background = {

        /**
         * Adds a listener to the background page.
         * @param {String} type    a unique identifier to map the listener to.
         *                         for this listener to receive a request, the
         *                         request must have a type property set to
         *                         the same string.
         * @param {Function(request, sender, sendResponse)} callback  listener
         *                         callback function.  request is a generic
         *                         object; sendResponse is a function to call
         *                         once the response is ready.  sender is not
         *                         currently supported in Firefox.
         */
        addListener: function (type, callback) {
            listeners[type] = callback;
        }
    };

    libx.events.addListener("RequestFromContentScript", {
        onRequestFromContentScript: function (e, request, sender, sendResponse) {
        
            var reqObj = libx.utils.json.parse(request);
            
            function wrappedSendResponse(response) {
                if (sendResponse) {
                    var resStr = libx.utils.json.stringify(response);
                    sendResponse(resStr);
                }
            }
            
            for (var i in listeners) {
                if (reqObj.type == i) {
                    listeners[i](reqObj, sender, wrappedSendResponse);
                    return;
                }
            }
            wrappedSendResponse({});
            
        }
    });
    
}) ();
