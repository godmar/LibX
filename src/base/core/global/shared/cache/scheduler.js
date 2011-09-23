
/* Algorithm:

updates.json:
* if updates.json does not exist, fetch it and process all children immediately
* if all files successfully update, schedule next update for current time + interval + random interval
* if there is a failure, set expires time for updates.json to current time + 1 min, 2 min, 4 min, 8 min, 16 min, etc, up to 4 hours

package scheduler:
* go through feeds with package walker, check all unmarked feeds, then mark them.

/*
BRN:
- add "resource" tags so packages can include images, etc
*/

(function () {

// testing intervals - please, if you activate them, don't leave your browser running.
// var defaultUpdateInterval = 10 * 1000; 
// var initialRetryInterval = 10 * 1000;
// var maxRetryInterval = 60 * 1000;
// var maxRandDelay = 10 * 1000;

// normal intervals
var defaultUpdateInterval = 24 * 60 * 60 * 1000;    
var initialRetryInterval = 60 * 1000;
var maxRetryInterval = 4 * 60 * 60 * 1000;
var maxRandDelay = 4 * 60 * 60 * 1000;

var DISABLE_SCHEDULERS = false;

function getFeedPath(url) {
    try {
        return url.match(/.*\//)[0];
    } catch (e) {
        libx.log.write('scheduler: error getting feed path for ' + url);
    }
}

function log(msg) {
    libx.log.write(msg, 'scheduler');
}

libx.cache.Scheduler = libx.core.Class.create({

    initialize: function (rootUrl) {
        this.rootUrl = rootUrl;
        this.updateInterval = defaultUpdateInterval;
        this.initialRetryInterval = initialRetryInterval;
        this.maxRetryInterval = maxRetryInterval;
        this.maxRandDelay = maxRandDelay;
    },

    objectCache: libx.cache.defaultObjectCache,

    rootDataType: "text",

    childDataType: "text",

    // set to "root" or "always"
    // "root" updates children only if root updated
    // "always" will update children unconditionally
    updateChildrenRule: "root",
    
    updateChildren: libx.core.AbstractFunction("libx.cache.Scheduler.updateChildren"),

    updatesFinished: libx.core.EmptyFunction,
    
    stopScheduling: function () {
        this.cancelUpdates = true;
    },
    
    scheduleUpdates: function () {
   
        if (DISABLE_SCHEDULERS)
            return;
        var self = this;
    
        function scheduleNextUpdate(timeout) {
            libx.utils.timer.setTimeout(updateRoot, timeout);
            log("scheduling update in " + Math.round(timeout / 1000) + " seconds for " + self.rootUrl);
        }

        /*
         * Check for update to root file, then update children if necessary
         */
        function updateRoot() {

            if (self.cancelUpdates)
                return;

            log("checking for updates to root: " + self.rootUrl);
            var rootUpdated = false;
            var updateQueue = new libx.utils.collections.ActivityQueue();
            var updateError = false;
            
            function checkForUpdates(url, shouldUpdate, callback) {
            
                var activity = new libx.utils.collections.EmptyActivity();

                function update(metadata) {
                    var updated = false;
                    self.objectCache.update({
                        url: url,
                        metadata: metadata,
                        dataType: self.childDataType,
                        validator: self.childValidator,
                        success: function () {
                            updated = true;
                            log(url + " updated");
                        },
                        error: function (status) {
                            updateError = true;
                            libx.log.write("scheduler: error status " + status + " updating " + url);
                        },
                        complete: function () {
                            callback && callback(updated);
                            activity.markReady();
                        }
                    });
                }
                
                log("checking for updates to child " + url);
                updateQueue.scheduleFirst(activity);
                self.objectCache.getMetadata({
                    url: url,
                    success: function (metadata) {
                        if (shouldUpdate(metadata))
                            update(metadata);
                        else
                            activity.markReady();
                    },
                    notfound: function () {
                        update();
                    }
                });
            }

            var saveToCache = null;
            var complete = function (metadata) {
                self.objectCache.update({
                    url: self.rootUrl,
                    metadata: metadata,
                    ignoreQuery: true,
                    dataType: self.rootDataType,
                    validator: self.rootValidator,
                    delayWrite: function (callback) {
                        // store the saveToCache callback so we can call it later.
                        // we only want to save root if/when all children have successfully updated.
                        saveToCache = callback;
                    },
                    success: function (data, status, xhr) {
                        rootUpdated = true;
                        log(self.rootUrl + " updated");
                        if (self.updateChildrenRule == "root")
                            self.updateChildren(checkForUpdates, data);
                    },
                    
                    error: function (status) {
                        libx.log.write("scheduler: error status " + status + " updating " + self.rootUrl);
                        updateError = true;
                    },
                    
                    complete: function () {
                        if (self.updateChildrenRule == "always" && !updateError)
                            self.updateChildren(checkForUpdates, null, updateQueue, function () {
                                updateError = true;
                            });
                        var updatesFinished = {
                            onready: function () {

                                if (updateError) {
                                    // double retry interval on each failure until max retry interval is reached
                                    var retry = 2 * self.currentRetryInterval || self.initialRetryInterval;
                                    if (retry > self.maxRetryInterval)
                                        retry = self.maxRetryInterval;
                                    self.currentRetryInterval = retry;
                                    
                                    log("updates unsuccessful for " + self.rootUrl);
                                    scheduleNextUpdate(retry);
                                    return;
                                }
                                
                                self.currentRetryInterval = 0;

                                function finishUpdates() {

                                    log("all updates completed successfully for " + self.rootUrl);
                                    self.updatesFinished(rootUpdated);

                                    // add random delay to update interval to reduce server load
                                    var delay = Math.floor(self.maxRandDelay * Math.random());
                                    scheduleNextUpdate(self.updateInterval + delay);

                                }

                                if (saveToCache)
                                    saveToCache(finishUpdates)
                                else
                                    finishUpdates();
                                
                            }
                        };
                        updateQueue.scheduleLast(updatesFinished);
                        updatesFinished.markReady();
                    }
                });
            };
            self.objectCache.getMetadata({
                url: self.rootUrl,
                ignoreQuery: true,
                success: function (metadata) {
                    complete(metadata);
                },
                notfound: function () {
                    complete();
                }
            });
        }
    
        self.objectCache.getMetadata({
            ignoreQuery: true,
            url: self.rootUrl,
            success: function (metadata) {
                var now = Date.now();
                var delay = Math.floor(self.maxRandDelay * Math.random());
                var expires = metadata.lastAccessed + self.updateInterval + delay;
                if (now < expires) {
                    // cache hasn't expired yet; schedule update
                    scheduleNextUpdate(expires - now);
                } else {
                    // cache has expired; update now
                    log(self.rootUrl + " expired; updating now")
                    updateRoot();
                }
            },
            notfound: function () {
                log(self.rootUrl + " not found in cache; updating now");
                updateRoot();
            }
        });
    }
    
});

libx.cache.HashScheduler = libx.core.Class.create(libx.cache.Scheduler, {
    rootDataType: "json",
    rootValidator: function (params) {
        if (/json/.test(params.mimeType) && params.data.files)
            params.success();
        else
            params.error();
    },
    childValidator: libx.cache.defaultMemoryCache.validators.bootstrapped,
    updateChildren: function (checkForUpdates, updateHashes) {
        var bootstrapBase = libx.locale.getBootstrapURL("");
        for (var relUrl in updateHashes.files) {
            var absUrl = bootstrapBase + relUrl;
            checkForUpdates(absUrl, function (metadata) {
                var hash = updateHashes.files[relUrl].hash;
                return metadata.sha1 != hash;
            });
        }    
    }
});

libx.cache.ConfigScheduler = libx.core.Class.create(libx.cache.Scheduler, {
    rootDataType: 'xml',
    rootValidator: libx.cache.defaultMemoryCache.validators.config,
    childValidator: function (params) {
        // we know nothing about the config.xml additionalfiles, so we can't validate them
        params.success();
    },
    updateChildren: function (checkForUpdates, configDoc) {
        var configPath = this.rootUrl.replace('/config.xml', '')
        var xmlItems = libx.utils.xpath.findNodesXML(configDoc, "/edition/additionalfiles/*");
        xmlItems.forEach(function (node) {
            var name = node.getAttribute("name");
            var url = configPath + "/" + name;
            checkForUpdates(url, libx.core.TrueFunction);
        });
    },
    updatesFinished: function (updated) {
        if (updated)
            libx.loadConfig(this.rootUrl);
    }
});

/*BRN: handle case where each entry is hosted at static URL; that is, getFeedPath()
       cannot be used for static files */
libx.cache.PackageScheduler = libx.core.Class.create(libx.cache.Scheduler, {
    initialize: function (rootUrl) {
        this.fullRootUrl = rootUrl;

        // the actual update URL is the feed's path, not its full id
        this.parent(getFeedPath(rootUrl));
    },
    rootDataType: 'xml',
    childDataType: 'xml',
    rootValidator: libx.cache.defaultMemoryCache.validators.feed,
    childValidator: libx.cache.defaultMemoryCache.validators.feed,
    updateChildrenRule: "always",
    updateChildren: function (checkForUpdates, feedDoc, updateQueue, markError) {

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
                        onmodule: onitem,
                        error: function () {
                            markError();
                            walkerAct.markReady();
                        }
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
                    checkForUpdates(entryPath, libx.core.TrueFunction, function (updated) {
                        if (updated)
                            libx.libapp.clearOverridden();
                        updateAct.markReady();
                    });
                }

            });

        }

        processEntries([{ url: this.fullRootUrl }]);
    }
});

libx.cache.TemplateScheduler = libx.core.Class.create(libx.cache.Scheduler, {
    scheduleUpdates: function () {
        var self = this;

        if (DISABLE_SCHEDULERS || this.cancelUpdates)
            return;
        
        log('checking for expired template files');
        var bootstrapBase = libx.locale.getBootstrapURL("");
        libx.storage.metacacheStore.find({
            // find all templates that are not included in the LibX bootstrapped items
            pattern: new RegExp('^(?!' + bootstrapBase + ').+\\.tmpl$'),
            success: function (templates) {
                templates.forEach(function (template) {
                    libx.cache.defaultObjectCache.getMetadata({
                        url: template,
                        success: function (metadata) {
                            if (metadata.expired) {
                                log(template + ' already marked as expired');
                                return;
                            }
                            var expires = metadata.lastAccessed + self.updateInterval;
                            if (Date.now() > expires) {
                                log(template + ' marked as expired');
                                // if template has expired
                                metadata.expired = true;
                                self.objectCache.putMetadata({
                                    url: template,
                                    metadata: metadata
                                });
                            }
                        }
                    });
                });
            }
        });

        libx.utils.timer.setTimeout(function () {
            self.scheduleUpdates.call(self);
        }, self.updateInterval);
        log("scheduling expiration check in " + Math.round(self.updateInterval / 1000) + " seconds for template files");
    }
});

new libx.cache.TemplateScheduler().scheduleUpdates();

libx.events.addListener("EditionConfigurationLoaded", {
    onEditionConfigurationLoaded: function () {
    
        libx.cache.defaultHashScheduler && libx.cache.defaultHashScheduler.stopScheduling();
        var jsonUrl = libx.locale.getBootstrapURL("updates.json");
        jsonUrl += "?edition=" + libx.edition.id + "&editionversion=" + libx.edition.version + "&libxversion=" + libx.version;
        libx.cache.defaultHashScheduler = new libx.cache.HashScheduler(jsonUrl);
        libx.cache.defaultHashScheduler.scheduleUpdates();
        
        libx.cache.defaultConfigScheduler && libx.cache.defaultConfigScheduler.stopScheduling();
        var configUrl = libx.utils.browserprefs.getStringPref("libx.edition.configurl");
        libx.cache.defaultConfigScheduler = new libx.cache.ConfigScheduler(configUrl);
        libx.cache.defaultConfigScheduler.scheduleUpdates();
        
    }
});

}) ();
