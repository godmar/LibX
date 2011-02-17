/*
 * Support for running libapps.
 * Global component.
 */ 
 
(function () {

// This code loads preferences associated with each entry in the user's
// subscribed packages.  It also adds the "_enabled" preference to each
// package/libapp.

libx.libapp.loadLibapps = function (feed, callback) {
    
    var aQ = new libx.utils.collections.ActivityQueue();
    
    function scheduledWalk(entries) {
    
        for (var i = 0; i < entries.length; i++) {
            
            (function () {
            
                var blocker = new libx.utils.collections.EmptyActivity();
                aQ.scheduleFirst(blocker);
                
                new libx.libapp.PackageWalker(entries[i].url).walk({
                
                    onpackage: function (pkg) {
                    
                        libx.prefs.getCategoryForUrl(pkg.id, [{
                            name: "_enabled",
                            type: "boolean",
                            value: "true"
                        }]);
                    
                        scheduledWalk(pkg.entries);
                        blocker.markReady();
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
                        
                        scheduledWalk(libapp.entries);
                        blocker.markReady();
                    },
                    
                    onmodule: function (module) {
                        if(module.preferences) {
                            libx.preferences.loadXML(module.preferences, { base: "libx.prefs" });
                        }
                        
                        scheduledWalk(module.entries);
                        blocker.markReady();
                    }
                    
                });
                
            }) ();
        }
        
    }
    
    scheduledWalk([{ url: feed }]);
    
    var callbackActivity = { onready: callback || libx.core.EmptyFunction };

    aQ.scheduleLast(callbackActivity);
    callbackActivity.markReady();
    
};

var rootPackages = [];
for (var i = 0; i < libx.prefs.libapps.feeds._items.length; i++) {
    var pkg = libx.prefs.libapps.feeds._items[i]._value;
    libx.log.write("Loading root feed from: " + pkg);
    libx.libapp.loadLibapps(pkg);
}

}) ();
