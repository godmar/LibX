/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is LibX Firefox Extension.
 *
 * The Initial Developer of the Original Code is Annette Bailey (libx.org@gmail.com)
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer and Virginia Tech. All Rights Reserved.
 *
 * Contributor(s): Godmar Back (godmar@gmail.com)
 * Contributor(s): Tobias Wieschnowsky (frostyt@vt.edu)
 * Contributor(s): Arif Khokar (aikhokar@cs.vt.edu)
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * @fileoverview
 *
 * Implement custom cache libx.cache.ObjectCache
 */
(function () {

var defaultUpdateInterval = 10 * 1000; // 10 sec for testing - please, if you activate that, don't leave your browser running.
var defaultUpdateInterval = 24 * 60 * 60 * 1000;    // 24 hours

var cacheStore = new libx.storage.Store('cache');
var metaStore = new libx.storage.Store('metacache');

function flagSuccess (request, metadata) {
    cacheStore.getItem({
        key: metadata.originURL,
        success: function(text) {
            request.success(text, metadata);
        },
        complete: request.complete
    });
}

var RetrievalType = { 
    GET : 1,    // get an item and invoke 'success'
    UPDATE : 2  // check for updates, signal event if updates occurred
}; 

function retrieveRequest(request, retrievalType) {
    var headers = {};
    if (retrievalType == RetrievalType.UPDATE) {
        if (request.lastModified != null)
            headers["If-Modified-Since"] = request.lastModified;
    }
    libx.cache.defaultMemoryCache.get({
        header: headers,
        url: request.url,
        serverMIMEType: request.serverMIMEType,
        bypassCache: true,
        error: function(data, status, xhr) {    
            if (status == 304) {
                libx.log.write("304 object not modified " + request.url, "objectcache");
            }
            if(request.error)
                request.error(status);
            if(request.complete)
                request.complete();
        },
        success: function (data, status, xhr) {
            var contentType = xhr.getResponseHeader("Content-Type");
            // XXX store 'expires' date on disk
            var metadata = {
                lastModified : xhr.getResponseHeader('Last-Modified'),
                mimeType : contentType,
                originURL : request.url
            };
    
            if(request.fetchDataUri) {
                data = 'data:' + contentType + ';base64,' + libx.utils.binary.binary2Base64(data);
            }
            
            var oldMetadata = null;
            
            var finishWrite = (function() {
                var count = 0;
                return function() {
                    count++;
                    // only continue after all operations below
                    if(count < 2)
                        return;
                    // fire 'update' on first retrieval or if last modified date signals newer version
                    if (retrievalType == RetrievalType.UPDATE && (oldMetadata == null || true)) {  // XXX really only if: || DateBefore(oldMetadata.lastModified, metadata.lastModified)
                        var updateEvent = new libx.events.Event("Update" + request.url);
                        updateEvent.metadata = metadata;
                        updateEvent.notify();
                    }
                    if (retrievalType == RetrievalType.GET) {
                        flagSuccess(request, metadata);
                    }
                };
            }) ();
            
            cacheStore.setItem({
                key: request.url,
                value: data,
                complete: finishWrite
            });
            
            getMetadata({
                url: request.url,
                success: function(data) { oldMetaData = data },
                complete: function() {
                    putMetadata({
                        url: request.url,
                        metadata: metadata,
                        complete: finishWrite
                    });
                }
            });

        }
    });
}

/*
 * Get metadata associated with a URL, or null if URL is not (or no longer!) cached
 */
function getMetadata(paramObj) {    
    metaStore.getItem({
        key: paramObj.url,
        success: function(text) {
            if(paramObj.success)
                paramObj.success(libx.utils.json.parse(text));
        },
        notfound: paramObj.notfound,
        complete: paramObj.complete
        
    });
}

/*
 * Write metadata to disk
 */
function putMetadata(paramObj) {
    metaStore.setItem({
        key: paramObj.url,
        value: libx.utils.json.stringify(paramObj.metadata),
        complete: paramObj.complete
    });
}

function updateRequests (cachedRequests) {
    libx.log.write("updating requests: " + cachedRequests.length, "objectcache");
    var lastMetadata = []

    // remove requests that have cleared their keepUpdated flag
    for (var i = 0; i < cachedRequests.length; i++) {
        var request = cachedRequests[i];
        if (!request.keepUpdated) {
            cachedRequests.splice(i--, 1);
            continue;
        }

        var paramObj = { url: request.url };
        paramObj.success = (function (request) {
            return function(metadata) {
                request.lastModified = metadata.lastModified;
                libx.log.write("checking " + request.url + " last modified: " + request.lastModified, "objectcache");
                retrieveRequest(request, RetrievalType.UPDATE);
            };
        }) (request);
        
        getMetadata(paramObj);

    }
}

/**
 * A file-backed cache for objects such as AtomPub XML documents, 
 * JavaScript files, and other resources such as images.
 *
 * @namespace
 */
libx.cache.ObjectCache = libx.core.Class.create(
    /** @lends libx.cache.ObjectCache.prototype */ {
    initialize: function (updateInterval) {
        if (updateInterval == null)
            updateInterval = defaultUpdateInterval;

        var self = this;
        this.cachedRequests = new Array();

        libx.utils.timer.setInterval(function () {
            updateRequests(self.cachedRequests);
        }, updateInterval);
    },

    /**
     *  Get an object, based on its URL.
     *  @param {Options} request 
     *      Modeled after <a href="http://docs.jquery.com/Ajax/jQuery.ajax#options">jQuery._ajax</a>
     *      with the following additions:
     *
     *  @param {Boolean} request.keepUpdated: if true, object is checked periodically.
     *      If an update is found, an update event is signaled.
     *      The event name is 'onUpdate' + URL.
     *
     *  @param {Boolean} request.fetchDataUri: if true, data is returned
     *      and stored as a data URI instead of raw data
     *
     *  @param {String} extension (optional) required extension, if any.  If not given, the
     *      extension is computed from the returned Content-Type.
     */
    get : function (request) {

        getMetadata({
            url: request.url,
            success: function(data) {
                flagSuccess (request, data);
            },
            notfound: function() {
                retrieveRequest(request, RetrievalType.GET);
            }
        });
        
        if (request.keepUpdated)
            this.cachedRequests.push(request);
    },

    /**
     * Remove all cached files
     */
    purgeAll : function () {
        cacheStore.clear();
    },

    /**
     * Update all requests that have the 'keepUpdated' flag set.
     */
    updateRequests : function () {
        updateRequests(this.cachedRequests);
    }
});

libx.cache.defaultObjectCache = new libx.cache.ObjectCache();

}) ();
