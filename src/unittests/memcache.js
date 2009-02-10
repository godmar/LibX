/*
 * Run unit tests in Rhino
 */

logger.write("Running unit tests for libx.cache.MemoryCache\n");
var passes = 0;
var Request = new libx.core.Class.create({
    url : "http://libx.cs.vt.edu/~gback/test.html",
    dataType : "text",
    async : true,
    success : function (result, status, xhr) {
        if (libx.utils.string.trim(result) == "success!!!" && status == 200)
            passes++;
        else
            logger.write("FAIL: status=" + typeof status + " result='" + result + "' (" + typeof result + ")\n");
    },
    error : function (result, status, xhr) {
        logger.write("error: " + status + " result=" + result + " xhr=" + xhr + "\n");
    }
});

var CACHESIZE = 4;
var cache = new libx.cache.MemoryCache(CACHESIZE);

// should only trigger 1 request
for (var i = 0; i < 3; i++)
    cache.get(new Request());

for (var i = 0; i < 3; i++) {
    var req = new Request();
    req.async = false;
    cache.get(req);
}

// force a second request
var req = new Request();
req.bypassCache = true;
cache.get(req);

// pollute the cache
for (var i = 0; i < CACHESIZE; i++) {
    var req = new Request();
    req.url += "?" + i;
    cache.get(req);
}

for (var i = 0; i < 3; i++)
    cache.get(new Request());

logger.write("check server log - should have received 3 requests for " + new Request().url + "\n");

// 

logger.write("waiting 2 sec for XHR request to complete\n");
java.lang.Thread.sleep(2000);

if (passes != 10 + CACHESIZE) {
    logger.write("Fail, only got " + passes + ", expected " + (10 + CACHESIZE) + "\n");
} else {
    logger.write("memcache unit tests passed\n");
}
