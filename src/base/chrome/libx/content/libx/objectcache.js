(function () {

var updateInterval = 24 * 60 * 60 * 1000;    // 24 hours
var updateInterval = 3 * 1000; // 60 sec
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

function computeExtensionFromContentType (mimeType) {
    mimeType = mimeType.split(';')[0];
    switch (mimeType) {
    case "image/gif":
        return ".gif";
    case "image/jpg":
        return ".jpg";
    case "image/png":
        return ".png";
    case "application/x-javascript":
        return ".js";
    case "text/plain":
        return ".txt";
    case "text/html":
        return ".html";
    case "text/xml":
    case "application/rss+xml":
    case "application/atom+xml":
        return ".xml";
    default:
        return "." + mimeType.replace(/\//g, "_");
    }
}

/* Reset a request's _unmetdependencies list */
function resetRequest(request) {
    request._unmetdependencies = [];
    delete request._metadata; 
    var dependencies = request.depends || [];

    for (var i = 0; i < dependencies.length; i++) {
        request._unmetdependencies.push(dependencies[i]);
    }
}

/* Request has completed.
 * Invoke 'success' if all dependencies have been met.
 */
function flagSuccess (request) {
    /* Remove already completed dependencies. */
    var unmetdependencies = request._unmetdependencies;
    for (var i = 0; i < unmetdependencies.length; i++) {
        if (unmetdependencies[i]._metadata != null)
            unmetdependencies.splice(i, 1);
    }

    /* Done if any dependencies have not yet completed */
    if (unmetdependencies.length > 0)
        return;

    /* Signal success. */
    var metadata = request._metadata;
    if (request.success)
        request.success(libx.io.getFileText(metadata.localPath), metadata);
    
    /* Notify dependents. */
    for (var i = 0; i < request._dependents.length; i++) {
        var dependent = request._dependents[i];
        for (var j = 0; j < dependent._unmetdependencies.length; j++) {
            if (dependent._unmetdependencies[j] == request) {
                dependent._unmetdependencies.splice(j, 1);
                break;
            }
        }

        flagSuccess(dependent);
    }
}


var RetrievalType = { 
    UNCONDITIONAL : 1, 
    ONLYIFMODIFIED : 2 
}; 


function retrieveRequest(request, retrievalType) {
    var headers = {};
    if (retrievalType == RetrievalType.ONLYIFMODIFIED) {
        if (request.lastModified == null)
            throw "Must specify .lastModified if using conditional get";

        headers["If-Modified-Since"] = request.lastModified;
    }
    libx.cache.globalMemoryCache.get({
        header: headers,
        url: request.url,
        bypassCache: true,
        complete: function (data, status, xhr) {
            if (status == 304) {
                var metadataFile = calculateHashedPath (request.url) + fileinfoExt;
                request._metadata = libx.utils.json.parse(libx.io.getFileText(metadataFile));
                flagSuccess (request);
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
            request._metadata = metadata;
            libx.io.writeToFile (localPath, data, true);
            libx.io.writeToFile (baseLocalPath + fileinfoExt, libx.utils.json.stringify(metadata), true);
            flagSuccess (request);
        }
    });
}

function handleRequest(request) {
    // check if resource exists on disk
    var metadataFile = calculateHashedPath (request.url) + fileinfoExt;
    if (libx.io.fileExists(metadataFile)) {
        request._metadata = libx.utils.json.parse(libx.io.getFileText(metadataFile));
        // XXX: if now < request.expires then flagSuccess, 
        flagSuccess (request);
        // else {
        // request.lastModified = request._metadata.lastModified;
        // retrieveRequest(request, RetrievalType.ONLYIFMODIFIED);
        // }
    } else {
        retrieveRequest(request, RetrievalType.UNCONDITIONAL);
    }
}

function updateRequests (cachedRequests) {
    libx.log.write("updating requests: " + cachedRequests.length);
    var lastMetadata = []
    for (var i = 0; i < cachedRequests.length; i++) {
        if (cachedRequests[i]._metadata) {   // request did previously complete
            lastMetadata.push(cachedRequests[i]._metadata);
        } else {
            lastMetadata.push({ DID_NOT_COMPLETE : 1});
        }
        resetRequest(cachedRequests[i]);
    }

    for (var i = 0; i < cachedRequests.length; i++) {
        var request = cachedRequests[i];
        request.lastModified = lastMetadata[i].lastModified;
        libx.log.write("re-retrieving " + request.url + " last modified: " + request.lastModified);

        var metadataFile = calculateHashedPath (request.url) + fileinfoExt;
        if (libx.io.fileExists(metadataFile)) {
            retrieveRequest(request, RetrievalType.ONLYIFMODIFIED);
        } else {
            retrieveRequest(request, RetrievalType.UNCONDITIONAL);
        }
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
    initialize: function () {
        var self = this;
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
     *  @param {Array} request.depends: a list of previously issued requests on which
     *      this request depends.  The cache will guarantee that the success and
     *      update callbacks of all dependent objects are executed prior to the
     *      execution of this request's callback.
     *
     *  @param {Boolean} request.keepUpdated: if true, object is checked periodically.
     *      If an update is found, 'success' is called on it.  Thus, 'success' must be
     *      idempotent.
     *
     *  @param {String} extension (optional) required extension, if any.  If not given, the
     *      extension is computed from the returned Content-Type.
     */
    get : function (request) {

        // initialize dependents of this request
        request._dependents = [];   

        // record this request as a dependent for each of its dependencies
        var dependencies = request.depends || [];
        for (var i = 0; i < dependencies.length; i++) {
            dependencies[i]._dependents.push(request);
        }

        // mark all dependencies as unmet initially
        resetRequest(request);

        handleRequest(request);
        
        if (request.keepUpdated)
            this.cachedRequests.push(request);
    },
    /**
     * List of cached request that must be kept up to date.
     */
    cachedRequests: new Array(),

    /**
     * Update all requests that have the 'keepUpdated' flag set.
     */
    updateRequests : function () {
        updateRequests(this.cachedRequests);
    }
});

libx.cache.defaultObjectCache = new libx.cache.ObjectCache();

}) ();
