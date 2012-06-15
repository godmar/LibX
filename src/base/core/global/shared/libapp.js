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

function getUserPackages() {
    var userPackages;
    try {
        userPackages = libx.utils.json.parse(
            libx.utils.browserprefs.getStringPref("libx.libapp.userpackages", "[]"));
    } catch (e) {
        userPackages = [];
        libx.utils.browserprefs.setStringPref("libx.libapp.userpackages", "[]");
    }
    return userPackages;
}

/**
 * Clears any temporary packages the user has subscribed to.
 * Note: {@link libx.libapp.reloadPackages} must be called for changes to take effect.
 */
libx.libapp.clearTempPackages = function () {
    tmpPackages = [];
};

/**
 * Add a package that temporarily replaces an existing package.
 * The temporary package is lost when the browser is closed.
 * Note: {@link libx.libapp.reloadPackages} must be called for changes to take effect.
 * 
 * @param {String} permUrl  the permanent package URL.  this package
 *                          is disabled while the temporary package is active.
 * @param {String} tempUrl  the temporary package URL.  this package
 *                          is temporarily active for the browsing session.
 */
libx.libapp.addTempPackage = function (permUrl, tempUrl) {
    for (var i = 0; i < tmpPackages.length; i++) {
        // disallow duplicates
        if (tmpPackages[i].tempUrl == tempUrl)
            return;
    }
    tmpPackages.push({ permUrl: permUrl, tempUrl: tempUrl });
};

/**
 * Get an array of packages the user is temporarily subscribed to.
 *
 * @returns {Array} array of object ; each object has two properties of type string,
 *  permUrl and tempUrl which are package URLs
 */
libx.libapp.getTempPackages = function ( ) {
    return tmpPackages;
};

/**
 * Unsubscribes from a temporary subscribed package.
 * Note: {@link libx.libapp.reloadPackages} must be called for changes to take effect.
 *
 * @param {String} pkg  URL of package to unsubscribe from
 * @returns {Boolean} whether the package was successfully unsubscribed
 */
libx.libapp.removeTempPackage = function (tempUrl) {
    for (var i = 0; i < tmpPackages.length; i++) {
        // disallow duplicates
        if (tmpPackages[i].tempUrl == tempUrl)
        {
           tmpPackages.splice(i,1);
           return true;
        }
    }
    return false;
};

/**
 * Unsubscribes from a user-subscribed package.
 * Note: {@link libx.libapp.reloadPackages} must be called for changes to take effect.
 *
 * @param {String} pkg  URL of package to unsubscribe from
 * @returns {Boolean} whether the package was successfully unsubscribed
 */
libx.libapp.removeUserPackage = function (pkg) {
    var userPackages = getUserPackages();
    var idx = userPackages.indexOf(pkg);
    if (idx < 0)
        return false;
    userPackages.splice(idx, 1);
    libx.utils.browserprefs.setStringPref("libx.libapp.userpackages",
        libx.utils.json.stringify(userPackages));
    return true;
};

/**
 * Subscribe to a user-chosen package.
 * Note: {@link libx.libapp.reloadPackages} must be called for changes to take effect.
 *
 * @param {String} pkg  URL of package to subscribe to
 * @returns {Boolean} false if the user is already subscribed to the given
 *                    package
 */
libx.libapp.addUserPackage = function (pkg) {
    if (this.getPackages().indexOf(pkg) >= 0)
        return false;
    var userPackages = getUserPackages();
    userPackages.push(pkg);
    libx.utils.browserprefs.setStringPref("libx.libapp.userpackages",
        libx.utils.json.stringify(userPackages));
    return true;
};

/**
 * Get an array of packages the user is subscribed to.
 *
 * @param {Boolean} enabledOnly  if true, only returns the packages that are enabled
 * @returns {Array} array of strings; each string is a package URL
 */
libx.libapp.getPackages = function (enabledOnly) {

    if (!allPackages) {
        allPackages = [];
        libx.edition.localizationfeeds['package'].forEach(function (pkg) {
            allPackages.push(pkg.url);
        });
        var userPackages = getUserPackages();
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
            for (var i = 0; i < tmpPackages.length; i++)
                if (tmpPackages[i].permUrl == pkg)
                    return false;
            // if a packages's preferences don't exist, it's enabled
            return !libx.prefs[pkg] || libx.prefs[pkg]._enabled._value;
        });

        for (var i = 0; i < tmpPackages.length; i++) {
            enabledPackages.push(tmpPackages[i].tempUrl);
        }
    }
    return enabledPackages;

};

/**
 * Reloads all packages.
 * This stops all running {@link libx.cache.PackageScheduler}s and starts a new
 * {@link libx.cache.PackageScheduler} for each enabled package.
 */
libx.libapp.reloadPackages = function () {
    allPackages = null;
    enabledPackages = null;
    libx.libapp.clearOverridden();
    for (var scheduler; scheduler = packageSchedulers.pop();)
        scheduler.stopScheduling();
    this.getPackages(true).forEach(function (pkg) {
        var scheduler = new libx.cache.PackageScheduler(pkg);
        scheduler.scheduleUpdates(true);
        packageSchedulers.push(scheduler);
    });
};

// if this entry has an overrides field, update the overridden mapping
function setOverride(entry, callback) {
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

/**
 * Clear the cached overridden entries mapping.
 */
libx.libapp.clearOverridden = function () {
    overridden = null;
};

/**
 * Get overriding LibApps and packages.
 * 
 * @param {Function(overridden)} callback  callback function that returns an
 *        overridden mapping.  the mapping is a two-dimensional keyset; the
 *        first key is the entry being overridden, and the second key is an
 *        overrider.
 */
libx.libapp.getOverridden = function (callback) {

    var overrideQueue = new libx.utils.collections.ActivityQueue();

    function findOverrides(entries) {
        
        entries.forEach(function (entry) {
            var activity = new libx.utils.collections.EmptyActivity();
            overrideQueue.scheduleFirst(activity);
        
            new libx.libapp.PackageWalker(entry.url).walk({
                onpackage: function (pkg) {
                    setOverride(pkg, function () {
                        findOverrides(pkg.entries);
                    });
                    activity.markReady();
                },
                onlibapp: function (libapp) {
                    setOverride(libapp);
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

