
libx.ui.tabs = (function() {
        
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                .getService(Components.interfaces.nsIWindowMediator);
    
    return {
            
        sendRequestToSelected : function(request, callback) {
            var mainWindow = wm.getMostRecentWindow("navigator:browser");
            var pageRequest = new libx.events.Event("RequestToContentScript",
                    mainWindow.gBrowser.contentWindow);
            var reqStr = libx.utils.json.stringify(request);
            pageRequest.notify(reqStr, null, function(response) {
                if(callback) {
                    var resObj = libx.utils.json.parse(response);
                    callback(resObj);
                }
            });
        },
    
    };

}) ();