/*
 * Load LibX code, per window
 */

libx.log.write("bootstrapping libx from: " + baseUrl + " parent=" + parentRequest.url);
var files = [
    "base/libapp.js",
    "base/atomparser.js",
];

