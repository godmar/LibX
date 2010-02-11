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
var jsSubScriptLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader);

var globalScripts = [
    "chrome://libx/content/core/global/shared/core.js",
    "chrome://libx/content/core/global/shared/libx.js",
    "chrome://libx/content/core/global/shared/log.js",
    "chrome://libx/content/core/global/shared/io.js",
    "chrome://libx/content/core/global/shared/locale.js",
    "chrome://libx/content/core/global/shared/preferences.js",
    "chrome://libx/content/core/global/shared/cache/memorycache.js",
    "chrome://libx/content/core/global/shared/locale.js",
    "chrome://libx/content/core/global/shared/config.js",
    "chrome://libx/content/core/global/shared/config/xmlconfigwrapper.js",
    "chrome://libx/content/core/global/shared/config/editionconfigurationreader.js",
    "chrome://libx/content/core/global/shared/events.js",
    "chrome://libx/content/core/global/shared/utils/json.js",
    "chrome://libx/content/core/global/shared/catalog.js",
    "chrome://libx/content/core/global/shared/catalog/catalog.js",
    "chrome://libx/content/core/global/shared/catalog/factory/bookmarklet.js",
    "chrome://libx/content/core/global/shared/catalog/factory/scholar.js",
    "chrome://libx/content/core/global/shared/catalog/factory/millenium.js",
    "chrome://libx/content/core/global/shared/catalog/factory/horizon.js",
    "chrome://libx/content/core/global/shared/catalog/factory/voyager.js",
    "chrome://libx/content/core/global/shared/catalog/factory/aleph.js",
    "chrome://libx/content/core/global/shared/catalog/factory/sirsi.js",
    "chrome://libx/content/core/global/shared/catalog/factory/web2.js",
    "chrome://libx/content/core/global/shared/catalog/factory/centralsearch.js",
    "chrome://libx/content/core/global/shared/catalog/factory/custom.js",
    "chrome://libx/content/core/global/shared/catalog/factory/evergreen.js",
    "chrome://libx/content/core/global/shared/catalog/factory/worldcat.js",
    "chrome://libx/content/core/global/shared/catalog/factory/vubis.js",
    "chrome://libx/content/core/global/shared/catalog/factory/voyager7.js",
    "chrome://libx/content/core/global/shared/catalog/factory/talisprism.js",
    "chrome://libx/content/core/global/shared/catalog/factory/polaris.js",
    "chrome://libx/content/core/global/shared/catalog/factory/openurlresolver.js",
    "chrome://libx/content/core/global/shared/citeulike.js",
    "chrome://libx/content/core/global/shared/proxy.js",
    "chrome://libx/content/core/global/shared/proxy/factory/ezproxy.js",
    "chrome://libx/content/core/global/shared/proxy/factory/wam.js",
    "chrome://libx/content/core/global/shared/bootstrap.js",
    "chrome://libx/content/core/global/ff/log.js",
    "chrome://libx/content/core/global/ff/cache.js",
    "chrome://libx/content/core/global/ff/utils/timer.js",
    "chrome://libx/content/core/global/ff/utils/xml.js",
    "chrome://libx/content/core/global/ff/locale.js",
    "chrome://libx/content/core/global/ff/bootstrap.js",
    "chrome://libx/content/core/global/shared/cache/objectcache.js",
    "chrome://libx/content/core/global/ff/utils/browserprefs.js",
    "chrome://libx/content/core/global/shared/utils/hash.js",
    "chrome://libx/content/core/global/shared/openurl.js",
    "chrome://libx/content/core/global/shared/utils/stdnumsupport.js",
    "chrome://libx/content/core/global/ff/utils/xpath.js",
    "chrome://libx/content/core/global/shared/services/xisbn.js",
    "chrome://libx/content/core/global/shared/services/pubmed.js",
    "chrome://libx/content/core/global/shared/services/crossref.js",
    "chrome://libx/content/core/global/ff/libapp/sandbox.js",
];

for (var i = 0; i < globalScripts.length; i++) {
    try {
        jsSubScriptLoader.loadSubScript(globalScripts[i]);
    } catch (e) {
        var where = e.location || (e.fileName + ":" + e.lineNumber);
        log("Error while loading " + globalScripts[i] + ": " + e + " " + where);
    }
}

try {
    libx.initialize();
} catch (er) {
    log("Error in libx.initialize(): " + er);
}

function LibXComponent() {
    //This allows access only from JavaScript
    this.wrappedJSObject = this;
};

LibXComponent.prototype = {
    classDescription : "LibX component",
    classID          : Components.ID("{2b9e2ab0-83db-4b19-a7e0-3371a2c79619}"),
    contractID       : "@libx.org/libxcomponent;1",

    QueryInterface   : XPCOMUtils.generateQI([]),

    // capture global libx object
    libx             : libx,
};

function NSGetModule(compMgr, fileSpec) {
    return XPCOMUtils.generateModule([LibXComponent]);
}
