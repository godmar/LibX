//Based on example code at 
//https://developer.mozilla.org/en/How_to_Build_an_XPCOM_Component_in_Javascript#Creating_the_Component

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function LibXComponent() {
    //This allows access only from JavaScript
    this.wrappedJSObject = this;
};

LibXComponent.prototype = {
    classDescription : "LibX component",
    classID          : Components.ID("{2b9e2ab0-83db-4b19-a7e0-3371a2c79619}"),
    contractID       : "@libx.org/libxcomponent;1",

    _xpcom_categories : [ {
            category : "app-startup"
        }
    ],

    //Implement nsIObserver
    QueryInterface   : XPCOMUtils.generateQI([Components.interfaces.nsIObserver]),

    //This should invoke parseChrome when Firefox starts
    observe : function(aSubject, aTopic, aData) {
        if (aTopic == "app-startup")
            this.parseChrome();
    },

    xmlreq : null,

    instanceCount    : 0,

    parseChrome      : function () {

        Cc["@mozilla.org/moz/jssubscript-loader;1"]
            .getService(Ci.mozIJSSubScriptLoader)
            .loadSubScript("chrome://libx/content/libxcoreclass.js");

        Cc["@mozilla.org/moz/jssubscript-loader;1"]
            .getService(Ci.mozIJSSubScriptLoader)
            .loadSubScript("chrome://libx/content/libx.js");

        Cc["@mozilla.org/moz/jssubscript-loader;1"]
            .getService(Ci.mozIJSSubScriptLoader)
            .loadSubScript("chrome://libx/content/documentrequestcache.js");
    },

    //This will instantiate the DocumentRequest only one time (per application start)
    getMemoryCache   : function () { 
        if (libx.cache.MemoryCacheInstance === undefined) {
            libx.cache.MemoryCacheInstance = new libx.cache.memorycache.MemoryCache();
        }
        
        return libx.cache.MemoryCacheInstance;
    },

    getDiskCache     :  function () { },

};

var components = [LibXComponent];

function NSGetModule(compMgr, fileSpec) {
    return XPCOMUtils.generateModule(components);
}


