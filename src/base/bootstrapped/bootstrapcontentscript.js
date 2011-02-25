/* 
 * Files to be included in content script (Chrome) and sandbox (Firefox)
 */
libx.log.write("bootstrapping content-script global libx from: " + bootStrapper.baseURL);
var files = [
    "global/shared/libapp/tuplespace.js",
    "global/shared/libapp/atomparser.js",
    "global/shared/utils/collections/vector.js",
    "global/shared/services/link360.js",
    "global/shared/services/oclcidentities.js",
    "global/shared/libapp/textexplorer.js",
    "global/shared/libapp/texttransformer.js"
];

for (var i = 0; i < files.length; i++) {
    bootStrapper.loadScript(bootStrapper.baseURL + files[i]);
}

bootStrapper.finish();
