
// implements abstract function in core/global/shared/cache/memorycache.js
libx.cache.bd = {
    getXMLHttpReqObj : function () {
       return Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                .createInstance(Components.interfaces.nsIXMLHttpRequest);
    }
};
