/* nothing */
libx.log.write("bootstrapping global libx from: " + scriptBase.baseURL);
var files = [
    "base/tuplespace.js",
    "base/atomparser.js",
];

for (var i = 0; i < files.length; i++) {
    libx.bootstrap.loadScript(scriptBase.baseURL + files[i]);
}

libx.bootstrap.finish();
