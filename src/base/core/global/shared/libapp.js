/*
 * Support for running libapps.
 * Global component.
 */ 
 
(function () {

var tmpPackages = [];

libx.libapp.clearTempPackages = function () {
    tmpPackages = [];
};

libx.libapp.addTempPackage = function (permUrl, tempUrl) {
    for (var i = 0; i < tmpPackages.length; i++) {
        // disallow duplicates
        if (tmpPackages[i].tempUrl == tempUrl)
            return;
    }
    tmpPackages.push({ permUrl: permUrl, tempUrl: tempUrl });
};

libx.libapp.getEnabledPackages = function () {
    var packages = [];
    for (var i = 0; i < libx.prefs.libapps.feeds._items.length; i++) {
        var pkg = libx.prefs.libapps.feeds._items[i]._value;
        if (libx.prefs[pkg] && libx.prefs[pkg]._enabled._value) {
            var disabled = false;
            for (var j = 0; j < tmpPackages.length; j++)
                if (tmpPackages[j].permUrl == pkg)
                    disabled = true;
            if (!disabled)
                packages.push({ url: pkg });
        }
    }
    for (var i = 0; i < tmpPackages.length; i++)
        packages.push({ url: tmpPackages[i].tempUrl });
    return packages;
};

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
                    
                        libx.log.write("registered package: " + pkg.description
                                                              + " (" + pkg.id + ")", "libapp");
                        scheduledWalk(pkg.entries);
                        blocker.markReady();
                    },

                    onlibapp: function (libapp) {    
                    
                        libx.prefs.getCategoryForUrl(libapp.id, [{
                            name: "_enabled",
                            type: "boolean",
                            value: "true"
                        }]);
                    
                        if (libapp.preferences)
                            libx.preferences.loadXML(libapp.preferences, { base: "libx.prefs" });
                    
                        libx.log.write("registered libapp: " + libapp.description
                                                             + " (" + libapp.id + ")", "libapp");
                        scheduledWalk(libapp.entries);
                        blocker.markReady();
                    },
                    
                    onmodule: function (module) {
                        if (module.preferences)
                            libx.preferences.loadXML(module.preferences, { base: "libx.prefs" });
                        
                        scheduledWalk(module.entries);
                        blocker.markReady();
                    }
                    
                });
                
            }) ();
        }
        
    }
    
    try {
        scheduledWalk([{ url: feed }]);
    } catch (e) {
        libx.log.write("Error in libx.libapp.loadLibapps(): " + e);
    }
    
    var callbackActivity = {
        onready: function () {
            callback && callback();
        }
    };

    aQ.scheduleLast(callbackActivity);
    callbackActivity.markReady();
    
};

var prereqQueue = new libx.utils.collections.ActivityQueue();

// we need to wait for global scripts to use the atom parser
var globalBootstrapAct = new libx.utils.collections.EmptyActivity();
prereqQueue.scheduleLast(globalBootstrapAct);
libx.events.addListener("GlobalBootstrapDone", {
    onGlobalBootstrapDone: function () {
        globalBootstrapAct.markReady();
    }
});

// we need to wait for preferences to see which libapps to load
var prefsLoadedAct = new libx.utils.collections.EmptyActivity();
prereqQueue.scheduleLast(prefsLoadedAct);
libx.events.addListener("PreferencesLoaded", {
    onPreferencesLoaded: function () {
        prefsLoadedAct.markReady();
    }
});

var loadLibappsAct = {
    onready: function () {
        var rootPackages = [];
        for (var i = 0; i < libx.prefs.libapps.feeds._items.length; i++) {
            var pkg = libx.prefs.libapps.feeds._items[i]._value;
            libx.log.write("Loading root feed from: " + pkg);
            libx.libapp.loadLibapps(pkg);
        }
    }
};
prereqQueue.scheduleLast(loadLibappsAct);
loadLibappsAct.markReady();

}) ();
