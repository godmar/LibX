/* nothing */
libx.log.write("bootstrapping global libx from: " + bootStrapper.baseURL);
var files = [
    "global/shared/libapp/tuplespace.js",
    "global/shared/libapp/atomparser.js",
    "global/shared/utils/collections/vector.js",
    "global/shared/libapp/textexplorer.js",
    "global/shared/libapp/texttransformer.js",
    "global/shared/services/link360.js",
    "global/shared/services/oclcidentities.js",
    "global/shared/libapp.js",
];

for (var i = 0; i < files.length; i++) {
    bootStrapper.loadScript(bootStrapper.baseURL + files[i]);
}

bootStrapper.finish();

