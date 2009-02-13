/*
 * Load LibX code, per window
 */

libx.log.write("bootstrapping per-window libx from: " + scriptBase.baseURL);
var files = [
    "base/libapp.js",
];

for (var i = 0; i < files.length; i++) {
    libx.bootstrap.loadScript(scriptBase.baseURL + files[i]);
}

libx.bootstrap.finish();

