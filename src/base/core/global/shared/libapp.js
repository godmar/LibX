/*
 * Support for running libapps.
 * Global component.
 */ 
 
(function () {

var tmpPackages = [];
var overridden = null;
var allPackages = null;
var enabledPackages = null;
var packageSchedulers = [];

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

libx.libapp.removeUserPackage = function (pkg) {
    var userPackages = libx.utils.json.parse(
        libx.utils.browserprefs.getStringPref("libx.libapp.userpackages", "[]"));
    var idx = userPackages.indexOf(pkg);
    if (idx < 0)
        return false;
    userPackages.splice(idx, 1);
    libx.utils.browserprefs.setStringPref("libx.libapp.userpackages",
        libx.utils.json.stringify(userPackages));
    libx.libapp.reloadPackages();
    return true;
};

libx.libapp.addUserPackage = function (pkg) {
    if (this.getPackages().indexOf(pkg) >= 0)
        return false;
    var userPackages = libx.utils.json.parse(
        libx.utils.browserprefs.getStringPref("libx.libapp.userpackages", "[]"));
    userPackages.push(pkg);
    libx.utils.browserprefs.setStringPref("libx.libapp.userpackages",
        libx.utils.json.stringify(userPackages));
    libx.libapp.reloadPackages();
    return true;
};

libx.libapp.getPackages = function (enabledOnly) {

    if (!allPackages) {
        allPackages = [];
        libx.edition.localizationfeeds['package'].forEach(function (pkg) {
            allPackages.push(pkg.url);
        });
        var userPackages = libx.utils.json.parse(
            libx.utils.browserprefs.getStringPref("libx.libapp.userpackages", "[]"));
        userPackages.forEach(function (pkg) {
            // prevent duplicates
            if (allPackages.indexOf(pkg) < 0)
                allPackages.push(pkg);
        });
    }

    if (!enabledOnly)
        return allPackages;

    if (!enabledPackages) {
         enabledPackages = allPackages.filter(function (pkg) {
            // if a packages's preferences don't exist, it's enabled
            return !libx.prefs[pkg] || libx.prefs[pkg]._enabled._value;
        });

        // BRN: make sure tmp packages still work
        for (var i = 0; i < tmpPackages.length; i++)
            enabledPackages.push(tmpPackages[i].tempUrl);
    }
    return enabledPackages;

};

libx.libapp.reloadPackages = function () {
    allPackages = null;
    enabledPackages = null;
    libx.libapp.clearOverridden();
    for (var scheduler; scheduler = packageSchedulers.pop();)
        scheduler.stopScheduling();
    this.getPackages(true).forEach(function (pkg) {
        var scheduler = new libx.cache.PackageScheduler(pkg);
        scheduler.scheduleUpdates();
        packageSchedulers.push(scheduler);
    });
};

function checkOverride(entry, callback) {
    libx.prefs.getCategoryForUrl(entry.id,
        [{ name: "_enabled", type: "boolean", value: "true" }]);
    if (libx.prefs[entry.id]._enabled._value) {
        if (entry.override) {
            var overridee = entry.override;
            var overrider = entry.id;
            if (!overridden[overridee])
                overridden[overridee] = {};
            overridden[overridee][overrider] = 1;
        }
        callback && callback();
    }
}

libx.libapp.clearOverridden = function () {
    overridden = null;
};

// find overriding libapps and packages
libx.libapp.getOverridden = function (callback) {

    var overrideQueue = new libx.utils.collections.ActivityQueue();

    function findOverrides(entries) {
        
        entries.forEach(function (entry) {
            var activity = new libx.utils.collections.EmptyActivity();
            overrideQueue.scheduleFirst(activity);
        
            new libx.libapp.PackageWalker(entry.url).walk({
                onpackage: function (pkg) {
                    checkOverride(pkg, function () {
                        findOverrides(pkg.entries);
                    });
                    activity.markReady();
                },
                onlibapp: function (libapp) {
                    checkOverride(libapp);
                    activity.markReady();
                },
                error: function () {
                    activity.markReady();
                }
            }, activity);
            
        });
    }

    if (overridden)
        callback(overridden);
    else {
        overridden = {};
        var enabled = this.getPackages(true).map(function (pkg) {
            return { url: pkg };
        });
        findOverrides(enabled);
        callbackAct = {
            onready: function () { callback(overridden); }
        };
        overrideQueue.scheduleLast(callbackAct);
        callbackAct.markReady();
    }

};

var prereqQueue = new libx.utils.collections.ActivityQueue();

// wait for preferences to see which packages are subscribed to
var prefsLoadedAct = new libx.utils.collections.EmptyActivity();
prereqQueue.scheduleLast(prefsLoadedAct);
libx.events.addListener("PreferencesLoaded", {
    onPreferencesLoaded: function () {
        prefsLoadedAct.markReady();
    }
});

// wait for global scripts so we can use the package walker.
// also, reload package schedulers whenever the edition configuration changes.
// this event takes care of both cases.
libx.events.addListener("GlobalBootstrapDone", {
    onGlobalBootstrapDone: function () {
        var bootstrapAct = {
            onready: function () {
                libx.libapp.reloadPackages();
            }
        };
        prereqQueue.scheduleLast(bootstrapAct);
        bootstrapAct.markReady();
    }
});

}) ();

