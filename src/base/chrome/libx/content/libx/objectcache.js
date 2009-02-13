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
var fileinfoExt = ".fileinfo.json";

/**
 * calculates the sha1 path associated with the url (without file ending)
 *
 * @param {String} url path to the file
 */
function calculateHashedPath ( url ) 
{
    var pathPattern = "0123456789AB/0123456789AB/0123456789ABCDEF";
    var firstSlashPos = pathPattern.indexOf("/");
    var secondSlashPos = pathPattern.lastIndexOf("/");

    var unprocessedPath = libx.utils.hash.hashString( url );
    var path = unprocessedPath.substring(0, firstSlashPos)
        + "/" + unprocessedPath.substring(firstSlashPos, secondSlashPos - 1)
        + "/" + unprocessedPath.substring(secondSlashPos - 1, pathPattern.length - 2);
    return path;
};

var contentType2Extension = {
    "image/gif":                ".gif",
    "image/jpg":                ".jpg",
    "image/png":                ".png",
    "application/x-javascript": ".js",
    "text/plain":               ".txt",
    "text/html":                ".html",
    "text/xml":                 ".xml",
    "application/rss+xml":      ".xml",
    "application/atom+xml":     ".xml"
};

function computeExtensionFromContentType (mimeType) {
    mimeType = mimeType.split(';')[0];
    if (contentType2Extension[mimeType])
        return contentType2Extension[mimeType];

    return "." + mimeType.replace(/\//g, "_");
}

function flagSuccess (request, metadata) {
    if (request.success)
        request.success(libx.io.getFileText(metadata.localPath), metadata);
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
    libx.cache.globalMemoryCache.get({
        header: headers,
        url: request.url,
        bypassCache: true,
        complete: function (data, status, xhr) {
            if (status == 304) {
                libx.log.write("304 object not modified " + request.url, "objectcache");
            }
        },
        success: function (data, status, xhr) {
            var contentType = xhr.getResponseHeader("Content-Type");
            var ext = request.ext || computeExtensionFromContentType(contentType);
            var baseLocalPath = calculateHashedPath (request.url);
            var localPath = baseLocalPath + ext;
            // XXX store 'expires' date on disk
            var metadata = {
                lastModified : xhr.getResponseHeader('Last-Modified'),
                mimeType : xhr.getResponseHeader('Content-Type'),
                originURL : request.url,
                localPath : localPath,
                chromeURL : "chrome://libxresource/content/" + localPath
            };
            libx.io.writeToFile (localPath, data, true);
            var oldMetadata = getMetadata(request.url);
            putMetadata(request.url, metadata);

            // fire 'update' on first retrieval or if last modified date signals newer version
            if (retrievalType == RetrievalType.UPDATE && (oldMetadata == null || true)) {  // XXX really only if: || DateBefore(oldMetadata.lastModified, metadata.lastModified)
                var updateEvent = new libx.events.Event("Update" + request.url);
                updateEvent.metadata = metadata;
                updateEvent.notify();
            }
            if (retrievalType == RetrievalType.GET)
                flagSuccess(request, metadata);
        }
    });
}

/*
 * Get metadata associated with a URL, or null if URL is not (or no longer!) cached
 */
function getMetadata(url) {
    var metadataFile = calculateHashedPath (url) + fileinfoExt;
    if (libx.io.fileExists(metadataFile))
        return libx.utils.json.parse(libx.io.getFileText(metadataFile));

    return null;
}

/*
 * Write metadata to disk
 */
function putMetadata(url, metadata) {
    libx.io.writeToFile (calculateHashedPath(url) + fileinfoExt, libx.utils.json.stringify(metadata), true);
}

function handleRequest(request) {
    var metadata = getMetadata(request.url);
    if (metadata == null) {
        retrieveRequest(request, RetrievalType.GET);
    } else {
        // XXX: if (now < request.expires) {
        flagSuccess (request, metadata);
        // } else {
        // request.lastModified = metadata.lastModified;
        // retrieveRequest(request, RetrievalType.ONLYIFMODIFIED);
        // }
    }
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

        var metadata = getMetadata(request.url);
        libx.log.write("checking " + request.url + " last modified: " + request.lastModified, "objectcache");

        if (metadata != null) {
            request.lastModified = metadata.lastModified;
        }
        retrieveRequest(request, RetrievalType.UPDATE);
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
     *  @param {String} extension (optional) required extension, if any.  If not given, the
     *      extension is computed from the returned Content-Type.
     */
    get : function (request) {

        handleRequest(request);
        
        if (request.keepUpdated)
            this.cachedRequests.push(request);
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
