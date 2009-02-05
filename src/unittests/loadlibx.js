/*
 * Run unit tests in Rhino
 */

var libxbase = "../base/chrome/libx/content/libx/";
var libxscripts1 = [
    "libxcoreclass.js",
    "libx.js",
    "documentrequestcache.js",
];

function loadScript(libxscripts) {
    for (var i = 0; i < libxscripts.length; i++) {
        try {
            load(libxbase + libxscripts[i]);
        } catch (er) {
            println("Exception loading: " + libxscripts[i] + " " + er);
        }
    }
}
loadScript(libxscripts1);

load("rhinoxhr.js");

libx.cache.bd = {
    getXMLHttpReqObj : function () {
        return new XMLHttpRequest();
    }
};

var returnDefault = function (pref, defvalue) { return defvalue; }
libx.utils.browserprefs.getBoolPref = returnDefault;

logger = {
    write : function (what) { print (what); }
};

var libxscripts2 = [
    "crossref.js",
    "pubmed.js",
    "xisbn.js",
];

loadScript(libxscripts2);

