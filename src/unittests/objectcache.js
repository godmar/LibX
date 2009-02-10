var cache = libx.cache.defaultObjectCache;

cache.get(req1 = {
    url : "http://libx.cs.vt.edu/icons/apache_pb2.gif",
    success : function (data, metadata) {
        println("success: " + metadata.mimeType + " " + metadata.lastModified);
        println("data.length: " + data.length);
    },
    keepUpdated : true
});

cache.get({
    url : "http://libx.cs.vt.edu/~gback/jquery/sometext.txt",
    success : function (data, metadata) {
        println("success3: " + metadata.mimeType + " " + metadata.lastModified);
        print("data: " + data);
    },
    depends: [ req1 ]
});

cache.get(req2 = {
    url : "http://libx.cs.vt.edu/~gback/jquery/sometext.txt",
    success : function (data, metadata) {
        println("success2: " + metadata.mimeType + " " + metadata.lastModified);
        print("data: " + data);
    },
    depends: [ req1 ]
});


println("sleeping 10 sec");
java.lang.Thread.sleep(10 * 1000);
