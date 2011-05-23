
/* Algorithm:

updates.json:
* if updates.json does not exist, fetch it and process all children immediately
* if all files successfully update, schedule next update for current time + interval + random interval
* if there is a failure, set expires time for updates.json to current time + 1 min, 2 min, 4 min, 8 min, 16 min, etc, up to 4 hours

package scheduler:
* go through feeds with package walker, check all unmarked feeds, then mark them.

/*
TODO:
- add "resource" tags so packages can include images, etc
- need to start/stop PackageSchedulers in libapp template when they are added/removed
*/

(function () {

// 10 sec for testing - please, if you activate that, don't leave your browser running.
var defaultUpdateInterval = 10 * 1000; 
// 24 hours
//var defaultUpdateInterval = 24 * 60 * 60 * 1000;    

// var initialRetryInterval = 60 * 1000;
// var maxRetryInterval = 4 * 60 * 60 * 1000;
// var maxRandDelay = 4 * 60 * 60 * 1000;
var initialRetryInterval = 5 * 1000;
var maxRetryInterval = 60 * 1000;
var maxRandDelay = 10 * 1000;

// BRN: make object cache generic
// BRN: change this
var updateInterval = defaultUpdateInterval;

function getFeedPath(url) {
    try {
        return url.match(/.*\//)[0];
    } catch (e) {
        libx.log.write('Error: Could not get feed path for ' + url);
    }
}

libx.cache.Scheduler = libx.core.Class.create({

    initialize: function (rootUrl) {
        this.rootUrl = rootUrl;
        this.defaultUpdateInterval = defaultUpdateInterval;
        this.initialRetryInterval = initialRetryInterval;
        this.maxRetryInterval = maxRetryInterval;
        this.maxRandDelay = maxRandDelay;
    },

    rootDataType: "text",

    // set to "root" or "always"
    // "root" updates children only if root updated
    // "always" will update children unconditionally
    updateChildrenRule: "root",
    
    updateChildren: libx.core.AbstractFunction("libx.cache.Scheduler.updateChildren"),
    
    stopScheduling: function () {
        this.cancelUpdates = true;
    },
    
    scheduleUpdates: function () {
    
        var self = this;
    
        function setRootExpiration(interval, retry, callback) {
            var metadata = {};
            var metadataMixin = {};
            
            metadataMixin["expires"] = new Date().getTime() + interval;
            retry && (metadataMixin["retry"] = interval);
            
            libx.cache.defaultObjectCache.getMetadata({
                ignoreQuery: true,
                url: self.rootUrl,
                success: function (m) {
                    metadata = m;
                },
                complete: function () {
                    libx.core.Class.mixin(metadata, metadataMixin, true);
                    libx.cache.defaultObjectCache.putMetadata({
                        ignoreQuery: true,
                        url: self.rootUrl,
                        metadata: metadata,
                        complete: function () {
                            libx.utils.timer.setTimeout(function () {
                                updateRoot(metadata);
                            }, interval);
                            libx.log.write("Scheduling update in " + Math.round(interval / 1000) + " seconds");
                            callback && callback();
                        }
                    });
                }
            });
        }
        
        /*
         * Check for update to root file, then update children if necessary
         */
        function updateRoot(rootMetadata) {

            if (self.cancelUpdates)
                return;

            libx.log.write("Updating files in: " + self.rootUrl);
            
            var updateQueue = new libx.utils.collections.ActivityQueue();
            var noErrors = true;
            
            function checkForUpdates(url, shouldUpdate, callback) {
            
                var activity = {
                    onready: function (success) {
                        noErrors = noErrors && success;
                    }
                };

                function update(metadata) {
                    // libx.log.write("Updating " + url);
                    libx.cache.defaultObjectCache.update({
                        lastModified: metadata && metadata.lastModified,
                        url: url,
                        success: function () {
                            libx.log.write(url + " updated");
                            activity.markReady(true);
                        },
                        error: function (status) {
                            libx.log.write("Error status " + status + " updating " + url);
                            activity.markReady(false);
                        },
                        complete: function () {
                            activity.markReady(true);
                            callback && callback();
                        }
                    });
                }
                
                libx.log.write("Checking for updates to " + url);
                updateQueue.scheduleLast(activity);
                libx.cache.defaultObjectCache.getMetadata({
                    url: url,
                    success: function (metadata) {
                        if (shouldUpdate(metadata))
                            update(metadata);
                        else
                            activity.markReady(true);
                    },
                    //BRN: should we only update if it exists?
                    notfound: function () {
                        update();
                        activity.markReady(true);
                        // libx.log.write(url + " not found; skipping update");
                    }
                });
            }

            libx.cache.defaultObjectCache.update({
                ignoreQuery: true,
                lastModified: rootMetadata.lastModified,
                url: self.rootUrl,
                dataType: self.rootDataType,
                success: function (data, status, xhr) {
                    if (self.updateChildrenRule == "root")
                        self.updateChildren(checkForUpdates, data);
                },
                
                error: function (status) {
                    libx.log.write("Error status " + status + " updating " + self.rootUrl);
                    noErrors = false;
                },
                
                complete: function () {
                    if (self.updateChildrenRule == "always" && noErrors)
                        self.updateChildren(checkForUpdates, null, updateQueue);
                    var updatesFinished = {
                        onready: function () {
                        
                            if (!noErrors) {
                                // double retry interval on each failure until max retry interval is reached
                                var retry = 2 * rootMetadata.retry || self.initialRetryInterval;
                                if (retry > self.maxRetryInterval)
                                    retry = self.maxRetryInterval;
                                
                                setRootExpiration(retry, true);
                                return;
                            }
                            
                            // add random delay to update interval to reduce server load
                            var delay = Math.floor(self.maxRandDelay * Math.random());
                            setRootExpiration(self.defaultUpdateInterval + delay, false, function () {
                                libx.log.write("All updates completed successfully.");
                                // BRN: reload global bootstrapped components
                            });
                            
                        }
                    };
                    updateQueue.scheduleLast(updatesFinished);
                    updatesFinished.markReady();
                }
            });
                                
        }
    
        libx.cache.defaultObjectCache.getMetadata({
            url: self.rootUrl,
            success: function (metadata) {
                var now = new Date().getTime();
                if (!metadata.expires) {
                    // first time checking this item; set expiration
                    var delay = Math.floor(self.maxRandDelay * Math.random());
                    setRootExpiration(self.defaultUpdateInterval + delay, false);
                    return;
                }
                if (metadata.expires > now) {
                    // cache hasn't expired yet; schedule update
                    var timeDiff = metadata.expires - now;
                    libx.utils.timer.setTimeout(function () {
                        updateRoot(metadata);
                    }, timeDiff);
                    libx.log.write(self.rootUrl + " metadata found; scheduling update in " + Math.round(timeDiff / 1000) + " seconds");
                    return;
                }
                libx.log.write(self.rootUrl + " metadata found; updating now")
                // cache has expired; update now
                updateRoot(metadata);
            },
            notfound: function () {
                libx.log.write(self.rootUrl + " metadata not found; updating now");
                updateRoot({});
            }
        });
    }
    
});

libx.cache.HashScheduler = libx.core.Class.create(libx.cache.Scheduler, {
    bootstrapBase: libx.locale.getBootstrapURL(""),
    updateChildren: function (checkForUpdates, json) {
        var hashEntries = libx.utils.json.parse(json);
        for (var relUrl in hashEntries.files) {
            var absUrl = this.bootstrapBase + relUrl;
            checkForUpdates(absUrl, function (metadata) {
                var hash = hashEntries.files[relUrl].hash;
                return metadata.sha1 != hash;
            });
        }    
    }
});

//BRN: if updated, call packagescheduler
libx.cache.ConfigScheduler = libx.core.Class.create(libx.cache.Scheduler, {
    updateChildren: function (checkForUpdates, xml) {
        var doc = libx.utils.xml.loadXMLDocumentFromString(xml);
        var configPath = this.rootUrl.replace('/config.xml', '')
        var xmlItems = libx.utils.xpath.findNodesXML(doc, "/edition/additionalfiles/*");
        for (var i = 0; i < xmlItems.length; i++) {
            var node = xmlItems[i];
            var name = node.getAttribute("name");
            var url = configPath + "/" + name;
            checkForUpdates(url, libx.core.TrueFunction);
        }
    }
});

libx.cache.PackageScheduler = libx.core.Class.create(libx.cache.Scheduler, {
    initialize: function (rootUrl) {
        this.fullRootUrl = rootUrl;

        // the actual update URL is the feed's path, not its entry
        this.parent(getFeedPath(rootUrl));
    },
    updateChildrenRule: "always",
    updateChildren: function (checkForUpdates, data, updateQueue) {

        // As we recursively walk the packages, we need to keep track of the
        // entries we have already visited to prevent updating them more than
        // once.  It's possible that we are visiting an entry that is currently
        // being updated; in this case, we need to wait for the update before
        // we walk it.
        var visited = {};

        // root feed has already been updated at this point
        visited[this.rootUrl] = new libx.utils.collections.ActivityQueue();

        function processEntries(entries) {

            entries.forEach(function (entry) {
            
                // this activity is used to block the updateQueue until
                // all entries have been updated
                var walkerAct = new libx.utils.collections.EmptyActivity();
                updateQueue.scheduleFirst(walkerAct);

                function walkChildren () {
                    function onitem(item) {
                        processEntries(item.entries);
                        walkerAct.markReady();
                    }

                    new libx.libapp.PackageWalker(entry.url).walk({
                        onpackage: onitem, 
                        onlibapp: onitem, 
                        onmodule: onitem
                    });
                }

                var entryPath = getFeedPath(entry.url)
                var updateAct = { onready: walkChildren };
                if (entryPath in visited) {
                    visited[entryPath].scheduleLast(updateAct);
                    updateAct.markReady();
                } else {
                    visited[entryPath] = new libx.utils.collections.ActivityQueue();
                    visited[entryPath].scheduleLast(updateAct);
                    checkForUpdates(entryPath, libx.core.TrueFunction, function () {
                        updateAct.markReady();
                    });
                }

            });

        }

        processEntries([{ url: this.fullRootUrl }]);
    }
});

}) ();
