
(function () {

    var listeners = {};

    libx.extension = {
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