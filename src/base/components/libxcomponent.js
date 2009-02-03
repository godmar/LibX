//Based on example code at 
//https://developer.mozilla.org/en/How_to_Build_an_XPCOM_Component_in_Javascript#Creating_the_Component

const Cc = Components.classes;
const Ci = Components.interfaces;

function log(msg) {
    var consoleService = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
    consoleService.logStringMessage("libxcomponent: " + msg);
}

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

//Parse chrome JavaScript here
Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://libx/content/libxcoreclass.js");
                                                                     
Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://libx/content/libx.js");
                                                                     
Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://libx/content/documentrequestcache.js");

function LibXComponent() {
    //This allows access only from JavaScript
    this.wrappedJSObject = this;
};

LibXComponent.prototype = {
    classDescription : "LibX component",
    classID          : Components.ID("{2b9e2ab0-83db-4b19-a7e0-3371a2c79619}"),
    contractID       : "@libx.org/libxcomponent;1",

    QueryInterface   : XPCOMUtils.generateQI([]),

    //Allow retrieval of per process libx and libxEnv from chrome
    libx             : libx,
    libxEnv          : libxEnv
};

function NSGetModule(compMgr, fileSpec) {
    return XPCOMUtils.generateModule([LibXComponent]);
}
