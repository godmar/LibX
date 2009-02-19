/* nothing */
libx.log.write("bootstrapping global libx from: " + scriptBase.baseURL);
var files = [
    "base/tuplespace.js",
    "base/atomparser.js",
    "base/vector.js",
    "base/textexplorer.js",
    "base/texttransformer.js",
    "base/link360service.js",
    "base/libapp_global.js",
];

for (var i = 0; i < files.length; i++) {
    libx.bootstrap.loadScript(scriptBase.baseURL + files[i]);
}

libx.bootstrap.finish();

