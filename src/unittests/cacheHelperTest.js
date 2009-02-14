// Unit tests for cache helper

importPackage(org.w3c.dom);
importPackage(javax.xml.xpath);
importPackage(javax.xml.parsers);
importPackage(javax.xml.namespace);
importClass(java.util.TimerTask);
importClass(org.xml.sax.SAXException);

var libxbase = "../base/chrome/libx/content/libx/";

var libxscripts = [
    "libxcoreclass.js",
    "libx.js",
    "cachehelper.js"
];

function loadScript(libxscripts) {
    for (var i = 0; i < libxscripts.length; i++) {
        try {
            load(libxbase + libxscripts[i]);
        } catch (er) {
            println("Exception loading: " + libxscripts[i] + " " + er);
        }
    }
}

loadScript(libxscripts);

//Load XMLHttpRequest
load("rhinoxhr.js");

//Send some xhrs
//
//window_attributes.txt will have a Cache-control header with max-age of two
//days
var xhrCacheControl = new XMLHttpRequest();
xhrCacheControl.open("GET", "http://top.cs.vt.edu/~aikhokar/testpage/window_attributes.txt", true);

//window_attributes.tzt will have an Expires header
var xhrExpires = new XMLHttpRequest();
xhrExpires.open("GET", "http://top.cs.vt.edu/~aikhokar/testpage/window_attributes.tzt", true);

//window_attributes will just have a Last-Modified header
var xhrLastMod = new XMLHttpRequest();
xhrLastMod.open("GET", "http://top.cs.vt.edu/~aikhokar/testpage/window_attributes", true);

xhrCacheControl.onreadystatechange = function ()
{
    if (xhrCacheControl.readyState == 4)
    {
        var myDate = libx.utils.cacheUtil.getExpireDate(xhrCacheControl);

        var allHeaders = xhrCacheControl.getAllResponseHeaders();
        print("Headers for Cache-Control test\n" + allHeaders);
        var lastMod = xhrCacheControl.getResponseHeader("Last-Modified");
        print("last mod " + lastMod);
        var lastModInt = (new Date(lastMod)).valueOf();

        var twoDays = 172800 * 1000;

        if (myDate - lastModInt == 172800 * 1000)
            print("\nPASSED Cache-Control header test\n");
        else
        {
            print("\nFAILED Cache-Control header test\n");
            var diff = myDate - lastModInt;
            print("got diff of " + diff + " should have had " + twoDays);
            print("myDate is " + myDate);
            print("lastModInt is " + lastModInt);
        }
    }
}

xhrCacheControl.send(undefined);

xhrExpires.onreadystatechange = function ()
{
    if (xhrExpires.readyState == 4)
    {
        var myDate = libx.utils.cacheUtil.getExpireDate(xhrExpires);

        var allHeaders = xhrExpires.getAllResponseHeaders();
        print("Headers for Expires test\n" + allHeaders);
        var expire = xhrExpires.getResponseHeader("Expires");
        print("Expire header " + expire);
        var expireInt = (new Date(expire)).valueOf();


        if (myDate == expireInt)
            print("\nPASSED Expires header test\n");
        else
        {
            print("\nFAILED Expires header test\n");
            var diff = myDate - expireInt;
            print("got diff of " + diff + " should have had 0");
            print("myDate is " + myDate);
            print("expireInt is " + expireInt);
        }
    }
}

xhrExpires.send(undefined);

xhrLastMod.onreadystatechange = function ()
{
    if (xhrLastMod.readyState == 4)
    {
        var myDate = libx.utils.cacheUtil.getExpireDate(xhrLastMod);
        var currDate = Date.parse(Date());

        var allHeaders = xhrLastMod.getAllResponseHeaders();
        print("Headers for LastMod test\n" + allHeaders);
        var lastMod = xhrLastMod.getResponseHeader("Last-Modified");
        print("LastMod header " + lastMod);
        var lastModInt = (new Date(lastMod)).valueOf();

        var timeSinceLastMod = currDate - (new Date(lastMod)).valueOf();
        var targetExp = currDate + Math.floor(0.5 * timeSinceLastMod);
        if (myDate == targetExp)
            print("\nPASSED Last-Modified header test\n");
        else
        {
            print("\nFAILED Last-Modified header test\n");
            var diff = targetExp - myDate ;
            print("got diff of " + diff + " should have had 0");
            print("myDate is " + myDate);
            print("targetExp " + targetExp);
        }
    }
}
xhrLastMod.send(undefined);
