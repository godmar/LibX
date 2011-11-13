
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

libx.cache.Scheduler = libx.core.Class.create(
    /** @lends libx.cache.Scheduler.prototype */ {

    /**
     * Generic scheduler class.
     * @constructs
     * @param {String} rootUrl  url of the root object for scheduling.  the
     *     "root" is the highest-level resource that contains other dependencies.
     *     for instance, the root for the config scheduler would be the edition
     *     config.xml, the root for the bootstrap scheduler would be the
     *     updates.json file, and the root for a feed scheduler would be a
     *     subscribed feed.
     */
    initialize: function (rootUrl) {
        this.rootUrl = rootUrl;
        this.updateInterval = defaultUpdateInterval;
        this.initialRetryInterval = initialRetryInterval;
        this.maxRetryInterval = maxRetryInterval;
        this.maxRandDelay = maxRandDelay;
    },

    /**
     * The object cache to use.
     * @type libx.cache.ObjectCache
     */
    objectCache: libx.cache.defaultObjectCache,

    /**
     * The data type of the root element.
     * Used for object cache request.  Options are "text", "xml", and "json".
     * @type String
     * @default "text"
     */
    rootDataType: "text",

    /**
     * The data type of the child elements.
     * Used for object cache request.  Options are "text", "xml", and "json".
     * @type String
     * @default "text"
     */
    childDataType: "text",

    /**
     * Update rule for children.
     * This determines when updateChildren() is called.  Options are "root" and "always".
     *   "root" updates children only if root updated
     *   "always" will update children unconditionally
     * @type String
     * @default "root"
     */
    updateChildrenRule: "root",

    /**
     * Function called when the children should be updated.
     * Abstract function.
     * @function
     * @param {Function(url, shouldUpdate, callback)} checkForUpdates
     *    callback function that should be executed for each child to check for
     *    updates.  url is a string for the child url.  shouldUpdate is a
     *    callback function that accepts metadata to determine whether the item
     *    should be updated (returns true or false).  callback is a callback
     *    function executed once the request has completed, and it accepts a
     *    boolean indicating whether the child was updated.
     * @param {Object} data
     *    the root data; will be the type specified by rootDataType
     * @param {libx.utils.collections.ActivityQueue} updateQueue
     *    activity queue for updates.  whenever checkForUpdates() is called,
     *    the request for that child is added to the queue.
     * @param {Function()} markError
     *    callback function that should be executed to indicate an error
     */
    updateChildren: libx.core.AbstractFunction("libx.cache.Scheduler.updateChildren"),

    /**
     * Function called once this root and children have been successfully
     * checked for updates.
     * Defaults to {@link libx.core.EmptyFunction}.
     * @function
     * @param {Boolean} updated  whether an update occurred
     */
    updatesFinished: libx.core.EmptyFunction,
    
    /**
     * Stops this scheduler.
     * Once called, this scheduler will no longer periodically check for updates.
     */
    stopScheduling: function () {
        this.cancelUpdates = true;
    },

    /**
     * Validator function for root item.
     * @see libx.cache.validators
     * @type Function
     * @default null
     */
    rootValidator: null,
    
    /**
     * Validator function for child items.
     * @see libx.cache.validators
     * @type Function
     * @default null
     */
    childValidator: null,

    /** 
     * Schedule updates for root entry and children.
     * @param {Boolean} force  whether the update should occur immediately.  if
     *                         false, the next update will be scheduled based
     *                         on when the last update occurred.
     */
    scheduleUpdates: function (force) {
   
        if (DISABLE_SCHEDULERS)
            return;
        var self = this;
    
        function scheduleNextUpdate(timeout) {
            libx.utils.timer.setTimeout(updateRoot, timeout);
            log("scheduling update in " + Math.round(timeout / 1000) + " seconds for " + self.rootUrl);
        }

        // check for update to root file, then update children if necessary
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
                if (!force && now < expires) {
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

/**
 * Scheduler for bootstrapped files.
 * First checks for updates to updates.json.  If updates.json has been updated,
 * each bootstrapped child's SHA1 is compared with the SHA1s in updates.json.
 * for each child whose SHA1 does not match, an update is triggered.
 * @augments libx.cache.Scheduler
 * @class
 */
libx.cache.HashScheduler = libx.core.Class.create(libx.cache.Scheduler,
    /** @lends libx.cache.HashScheduler.prototype */ {
    rootDataType: "json",
    rootValidator: function (params) {
        if (/json/.test(params.mimeType) && params.data.files)
            params.success();
        else
            params.error();
    },
    childValidator: libx.cache.validators.bootstrapped,
    updateChildren: function (checkForUpdates, updateHashes) {
        for (var relUrl in updateHashes.files) {
            (function (relUrl) {
                var absUrl = libx.utils.getBootstrapURL(relUrl);
                checkForUpdates(absUrl, function (metadata) {
                    var hash = updateHashes.files[relUrl].hash;
                    return metadata.sha1 != hash;
                });
            }) (relUrl);
        }    
    }
});

/**
 * Scheduler for edition configuration file.
 * First checks for updates to config.xml.  If config.xml has been updated,
 * each dependent file is checked for updates.
 * @augments libx.cache.Scheduler
 * @class
 */
libx.cache.ConfigScheduler = libx.core.Class.create(libx.cache.Scheduler,
    /** @lends libx.cache.ConfigScheduler.prototype */ {
    rootDataType: 'xml',
    rootValidator: libx.cache.validators.config,
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
/**
 * Scheduler for LibApp feeds.
 * All referenced feeds are also checked for updates.
 * @augments libx.cache.Scheduler
 * @class
 */
libx.cache.PackageScheduler = libx.core.Class.create(libx.cache.Scheduler,
    /** @lends libx.cache.PackageScheduler.prototype */ {
    initialize: function (rootUrl) {
        this.fullRootUrl = rootUrl;

        // the actual update URL is the feed's path, not its full id
        this.parent(getFeedPath(rootUrl));
    },
    rootDataType: 'xml',
    childDataType: 'xml',
    rootValidator: libx.cache.validators.feed,
    childValidator: libx.cache.validators.feed,
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

/**
 * Primitive scheduler for third party templates.
 * Iterates through each third party template in the object cache and marks it
 * as expired.  The template will be updated the next time it is used.
 * @augments libx.cache.Scheduler
 * @class
 */
libx.cache.TemplateScheduler = libx.core.Class.create(libx.cache.Scheduler,
    /** @lends libx.cache.TemplateScheduler.prototype */ {
    scheduleUpdates: function () {
        var self = this;

        if (DISABLE_SCHEDULERS || this.cancelUpdates)
            return;
        
        log('checking for expired template files');
        var bootstrapBase = libx.utils.getBootstrapURL("");
        libx.storage.metacacheStore.find({
            // find all templates that are not included in the LibX bootstrapped items
            pattern: new RegExp('^(?!' + bootstrapBase + ').+\\.tmpl$'),
            success: function (templates) {
                templates.forEach(function (template) {
                    self.objectCache.getMetadata({
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
        var jsonUrl = libx.utils.getBootstrapURL("updates.json");
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
