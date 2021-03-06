
/*
 * The code in this file is run:
 *   1) when this component is initially registered
 *   2) whenever the component is explicitly accessed (e.g., from a XUL file)
 * In other words, other than the component registration (the first load), code
 * in this file is NOT executed automatically.
 * 
 * Based on example code at 
 * https://developer.mozilla.org/en/How_to_Build_an_XPCOM_Component_in_Javascript#Creating_the_Component
 */

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

function loadLibX() {
    
    function log(msg) {
        var consoleService = Cc["@mozilla.org/consoleservice;1"]
            .getService(Ci.nsIConsoleService);
        consoleService.logStringMessage("libxcomponent: " + msg);
    }
    
    //Parse chrome JavaScript here
    var jsSubScriptLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
        .getService(Ci.mozIJSSubScriptLoader);
    
    var globalScripts = [
        "shared/core.js",
        "shared/libx.js",
        "shared/log.js",
        "ff/storage.js",
        "shared/preferences.js",
        "shared/utils/binary.js",
        "shared/cache/memorycache.js",
        "shared/cache/validators.js",
        "shared/config.js",
        "shared/config/xmlconfigwrapper.js",
        "shared/config/editionconfigurationreader.js",
        "shared/events.js",
        "shared/utils.js",
        "shared/utils/collections/vector.js",
        "shared/utils/collections/trie.js",
        "shared/catalog.js",
        "shared/catalog/catalog.js",
        "shared/catalog/preview.js",
        "shared/catalog/factory/bookmarklet.js",
        "shared/catalog/factory/scholar.js",
        "shared/catalog/factory/millenium.js",
        "shared/catalog/factory/horizon.js",
        "shared/catalog/factory/voyager.js",
        "shared/catalog/factory/aleph.js",
        "shared/catalog/factory/sirsi.js",
        "shared/catalog/factory/web2.js",
        "shared/catalog/factory/centralsearch.js",
        "shared/catalog/factory/custom.js",
        "shared/catalog/factory/evergreen.js",
        "shared/catalog/factory/worldcat.js",
        "shared/catalog/factory/vubis.js",
        "shared/catalog/factory/voyager7.js",
        "shared/catalog/factory/talisprism.js",
        "shared/catalog/factory/polaris.js",
        "shared/catalog/factory/openurlresolver.js",
        "shared/catalog/factory/primo.js",
        "shared/previewers/summon.js",
        "shared/previewers/summonwidget.js",
        "shared/citeulike.js",
        "shared/proxy.js",
        "shared/proxy/factory/ezproxy.js",
        "shared/proxy/factory/wam.js",
        "ff/log.js",
        "ff/cache.js",
        "ff/utils/timer.js",
        "ff/utils/json.js",
        "ff/utils/xml.js",
        "ff/utils/getextensionurl.js",
        "ff/utils/browserprefs.js",
        "shared/cache/objectcache.js",
        "shared/locale.js",
        "shared/libapp/atomparser.js",
        "shared/libapp/tuplespace.js",
        "shared/libapp/textexplorer.js",
        "shared/libapp/texttransformer.js",
        "shared/libapp.js",
        "shared/cache/scheduler.js",
        "ff/locale.js",
        "ff/utils/hash.js",
        "shared/openurl.js",
        "shared/utils/stdnumsupport.js",
        "shared/utils/coins.js",
        "shared/utils/stacktrace.js",
        "ff/utils/xpath.js",
        "ff/libapp/sandbox.js",
        "shared/ui/jquery/autocomplete.js",
        "shared/ui/jquery/dropdown.js",
        "shared/ui/jquery/accordionmenu.js",
        "shared/ui/magicsearch.js",
        "shared/ui.js",
        "shared/ui/contextmenu.js",
        "ff/ui.js",
        "ff/background.js",
        "shared/analytics.js",
        "shared/services/link360.js",
        "shared/services/oclcidentities.js",
        "shared/services/crossref.js",
        "shared/services/pubmed.js",
        "shared/services/xisbn.js",
        "shared/services/rfc.js",
        "shared/autoedition.js"
    ];
    
    for (var i = 0; i < globalScripts.length; i++) {
        var script = "chrome://libx/content/core/global/" + globalScripts[i];
        try {
            jsSubScriptLoader.loadSubScript(script);
        } catch (e) {
            var where = e.location || (e.fileName + ":" + e.lineNumber);
            log("Error while loading " + script + ": " + e + " " + where);
        }
    }
 
    try {
        libx.initialize(true);
    } catch (er) {
        log("Error in libx.initialize(): " + er);
    }

    try {
        var script = "chrome://libx/content/core/global/ff/analytics.js";
        jsSubScriptLoader.loadSubScript(script);
    } catch (e) {
        var where = e.location || (e.fileName + ":" + e.lineNumber);
        log("Error while loading " + script + ": " + e + " " + where);
    }
    
    try {
        // load config if user has one set
        var configUrl = libx.utils.browserprefs.getStringPref("libx.edition.configurl", null);
        if (configUrl) {
            libx.log.write('Loading config from ' + configUrl);
            libx.loadConfig(configUrl);
        }
        
        // load edition from cookie if it exists
        var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
        var uri = ios.newURI("$xpilocation$ff", null, null);
        var cookieSvc = Components.classes["@mozilla.org/cookieService;1"]
                          .getService(Components.interfaces.nsICookieService);
        var cookie = cookieSvc.getCookieString(uri, null);
        var match = cookie && cookie.match(/^libxedition=([^;]*)/, '');
        var edition = match && match[1];
        if (edition) {
            Components.classes["@mozilla.org/cookiemanager;1"]
                .getService(Components.interfaces.nsICookieManager)
                .remove("libx.org", "libxedition", "/releases/ff/", false);
            var path = libx.utils.getEditionPath(edition);
            var configUrl = 'http:/libx.org/editions/' + path + '/config.xml';
            libx.utils.browserprefs.setStringPref('libx.edition.configurl', configUrl);
            libx.loadConfig(configUrl);
        }
    } catch (er) {
        log("Error in libx.loadConfig(): " + er);
    }

    // listen for libx uninstallation
    Cu.import("resource://gre/modules/AddonManager.jsm");  
    var libxAddonId = "{d75de36c-af0d-4dc2-b63a-0d482d4b9815}";
    var beingUninstalled = false;
    AddonManager.addAddonListener({
      onUninstalling: function (addon) {
        if (addon.id == libxAddonId)
          beingUninstalled = true;
      },
      onOperationCancelled: function (addon) {
        if (addon.id == libxAddonId)
          beingUninstalled = (addon.pendingOperations & AddonManager.PENDING_UNINSTALL) != 0;  
      }
    });

    // if libx uninstalled, remove all libx prefs
    Cu.import("resource://gre/modules/Services.jsm");
    Services.obs.addObserver({
      observe: function (subject, topic, data) {
        if (beingUninstalled && topic == "profile-before-change")
          Services.prefs.getBranch("libx.").deleteBranch("");
      }
    }, "profile-before-change", false);
}

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function LibXComponent() {
    
    loadLibX();
    
    //capture global libx object
    this.libx = libx;
    
    //This allows access only from JavaScript
    this.wrappedJSObject = this;
}

LibXComponent.prototype = {
    classDescription : "LibX component",
    classID          : Components.ID("{2b9e2ab0-83db-4b19-a7e0-3371a2c79619}"),
    contractID       : "@libx.org/libxcomponent;1",
    QueryInterface   : XPCOMUtils.generateQI([])
};

/**
* XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4).
* XPCOMUtils.generateNSGetModule is for Mozilla 1.9.2 (Firefox 3.6).
*/
if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([LibXComponent]);
else
    var NSGetModule = XPCOMUtils.generateNSGetModule([LibXComponent]);

