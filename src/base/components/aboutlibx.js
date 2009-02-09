/**
 * Initializes the about:libx handler.
 * Initialization code based on: https://developer.mozilla.org/En/Code_snippets/JS_XPCOM
 *
 * @author Michael Doyle (doylem@vt.edu)
 *
 */

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
const Cc = Components.classes;
const Ci = Components.interfaces;
function AboutLibX() { }

AboutLibX.prototype = {
    newChannel : function(aURI) {   
        if(!aURI.spec == "about:libx") return;
        var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
        var channel = ios.newChannel("chrome://libxdoc/content/index.html", null, null);
        channel.originalURI = aURI;	
        return channel;
    },
    getURIFlags: function(aURI) {
        return Ci.nsIAboutModule.URI_SAFE_FOR_UNTRUSTED_CONTENT;
    },

    classDescription: "LibX Documentation Viewer",
    classID: Components.ID('{931fa643-9790-46c3-920f-8a8bfd8c7c9c}'),
    contractID: "@mozilla.org/network/protocol/about;1?what=libx",
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIAboutModule]),
}

function NSGetModule(aCompMgr, aFileSpec) {
  return XPCOMUtils.generateModule([AboutLibX]);
}