/* 
 * Files to be included in content script (Chrome) and sandbox (Firefox)
 */
libx.log.write("bootstrapping content-script libx from: " + bootStrapper.baseURL);
var files = [
    "global/shared/libapp/tuplespace.js",
    "global/shared/libapp/atomparser.js",
    "global/shared/utils/collections/vector.js",
    "global/shared/services/link360.js",
    "global/shared/services/oclcidentities.js",
    "global/shared/services/crossref.js",
    "global/shared/services/pubmed.js",
    "global/shared/services/xisbn.js",
    "global/shared/libapp/textexplorer.js",
    "global/shared/libapp/texttransformer.js",
    "window/shared/libapp.js",
    "window/shared/libappbuilder.js"
];

for (var i = 0; i < files.length; i++) {
    bootStrapper.loadScript(bootStrapper.baseURL + files[i]);
}

bootStrapper.finish();

