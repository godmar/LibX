/* 
 * Files to be included in background page (Chrome); component (Firefox)
 */
libx.log.write("bootstrapping global libx from: " + bootStrapper.baseURL);
var files = [
    "global/shared/utils/coins.js",
    "global/shared/previewers/summon.js",
    "global/shared/libapp/atomparser.js",
    "global/shared/utils/collections/vector.js",
    // "global/shared/services/link360.js",
    // "global/shared/services/oclcidentities.js",
    // "global/shared/libapp.js"   // read loaded libapp list
];

for (var i = 0; i < files.length; i++) {
    bootStrapper.loadScript(bootStrapper.baseURL + files[i]);
}

bootStrapper.finish();

// updated
