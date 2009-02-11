/*
 * Load LibX code, per window
 */

libx.log.write("bootstrapping libx from: " + scriptBase.baseURL + " parent=" + scriptBase.request.url);
var files = [
    "base/libapp.js",
    "base/atomparser.js",
];

for (var i = 0; i < files.length; i++) {
    scriptBase.loadDependentScript(scriptBase.baseURL + files[i]);
}
