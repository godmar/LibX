var cache = new libx.cache.ObjectCache(2000);
var queue = new libx.utils.collections.ActivityQueue();
var testUrl = "http://libx.cs.vt.edu/~gback/jquery/sometext.txt";

cache.get({
    url : "http://libx.cs.vt.edu/icons/apache_pb2.gif",
    success : function (data, metadata) {
        println("success: " + metadata.mimeType + " " + metadata.lastModified);
        println("data.length: " + data.length);
    },
    keepUpdated : true
});

queue.scheduleFirst(req1 = {
    onready: function () {
        println("success3: " + this.metadata.mimeType + " " + this.metadata.lastModified);
        print("data: " + this.data);
    }
});

queue.scheduleFirst(req2 = {
    onready: function () {
        println("success2: " + this.metadata.mimeType + " " + this.metadata.lastModified);
        print("data: " + this.data);
    }
});

cache.get({
    url : testUrl,
    success : function (data, metadata) {
        req1.data = data;
        req1.metadata = metadata;
        req1.markReady();
    },
    keepUpdated : true
});

cache.get({
    url : testUrl,
    success : function (data, metadata) {
        req2.data = data;
        req2.metadata = metadata;
        req2.markReady();
    }
});

var evHandler = { };
evHandler['onUpdate' + testUrl] = function (ev) {
    println("saw update for " + testUrl,
        + " -> " + ev.metadata.localPath 
        + " " + ev.metadata.lastModified);
}

libx.events.addListener("Update" + testUrl, evHandler);

println("sleeping 30 sec - please touch " + testUrl);
java.lang.Thread.sleep(30 * 1000);
