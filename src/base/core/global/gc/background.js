
(function () {

    var listeners = {};

    libx.background = {
        addListener: function (type, callback) {
            listeners[type] = callback;
        }
    };
    
    chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
        for (var i in listeners) {
            if (request.type == i) {
                listeners[i](request, sender, sendResponse);
                return true;
            }
        }
        sendResponse({});
    });

}) ();
