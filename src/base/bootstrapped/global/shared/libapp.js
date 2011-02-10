/*
 * Support for running libapps.
 * Global component.
 */ 
 
(function () {

// This code registers all libapps on browser startup
// Registrations will progress as quickly as the package tree
// can be walked.  It may be the case that an ContentLoaded event
// fires before the walk is complete, resulting in libapps
// not being executed on the first visit.

var RegisterLibappsClass = new libx.core.Class.create(libx.libapp.PackageVisitor, {

    onpackage: function (pkg) {
    
        libx.prefs.getCategoryForUrl(pkg.id, [{
            name: "_enabled",
            type: "boolean",
            value: "true"
        }]);
    
        this.parent(pkg);
    },

    onlibapp: function (libapp) {    
    
        libx.prefs.getCategoryForUrl(libapp.id, [{
            name: "_enabled",
            type: "boolean",
            value: "true"
        }]);
    
        if (libapp.preferences) {
            libx.preferences.loadXML(libapp.preferences, { base: "libx.prefs" });
        }
    
        libx.log.write("registered libapp: " + libapp.description, "libapp");
        
        this.parent(libapp);
    },
    
    onmodule: function (module) {
        if(module.preferences) {
            libx.preferences.loadXML(module.preferences, { base: "libx.prefs" });
        }
        
        this.parent(module);
    }
});
var registerLibapps = new RegisterLibappsClass();

libx.libapp.loadLibapps = function (edition) {
    //BRN: should there be a fallback for feeds if edition config.xml has none?
    //should this check for feeds.package.length?
    //e.g., Stanford edition has no feeds, but feeds.package = []
    
    var rootPackages = libx.prefs.libapps.feeds._items;
    
    for (var i = 0; i < rootPackages.length; i++) {
        if (rootPackages[i]._selected) {
            libx.log.write("Loading root feed from: " + rootPackages[i]._value);
            new libx.libapp.PackageWalker(rootPackages[i]._value).walk(registerLibapps);
        }
    }
}

if (libx.edition != null) {
    libx.libapp.loadLibapps(libx.edition);
} else {
    libx.events.addListener("EditionConfigurationLoaded", {
        onEditionConfigurationLoaded: function (event) {
            libx.libapp.loadLibapps(event.edition);
        }
    });
}

}());
