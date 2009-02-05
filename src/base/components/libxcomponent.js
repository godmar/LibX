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
    "chrome://libx/content/libxcoreclass.js",
    "chrome://libx/content/libx.js",
    "chrome://libx/content/log.js",
    "chrome://libx/content/documentrequestcache.js",
	"chrome://libx/content/config.js",
    "chrome://libx/content/events.js",
    "chrome://libx/content/catalogs/catalog.js",
	"chrome://libx/content/catalogs/milleniumopac.js",
	"chrome://libx/content/catalogs/horizonopac.js",
	"chrome://libx/content/catalogs/voyageropac.js",
	"chrome://libx/content/catalogs/alephopac.js",
	"chrome://libx/content/catalogs/sirsiopac.js",
	"chrome://libx/content/catalogs/web2opac.js",
	"chrome://libx/content/catalogs/centralsearch.js",
	"chrome://libx/content/catalogs/custom.js",
	"chrome://libx/content/catalogs/evergreen.js",
	"chrome://libx/content/catalogs/worldcat.js",
	"chrome://libx/content/catalogs/vubis.js",
	"chrome://libx/content/catalogs/voyager7.js",
	"chrome://libx/content/catalogs/talisprism.js",
	"chrome://libx/content/catalogs/openURLCatalog.js",
    "chrome://libx/content/citeulike-checkurl.js",
	"chrome://libx/content/proxy.js",
    "chrome://libx/content/libx.global.ff.js",
	"chrome://libx/content/prefs.ff.js",
	"chrome://libx/content/hash.js",
	"chrome://libx/content/openurl.js",
	"chrome://libx/content/doiutils.js",
	"chrome://libx/content/isbnutils.js",
	"chrome://libx/content/xpathutils.ff.js",
	"chrome://libx/content/xisbn.js",
	"chrome://libx/content/pubmed.js",
	"chrome://libx/content/crossref.js",
];

for (var i = 0; i < globalScripts.length; i++) {
    try {
        jsSubScriptLoader.loadSubScript(globalScripts[i]);
    } catch (er) {
        log("Error while loading " + globalScripts[i] + ": " + er);
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
