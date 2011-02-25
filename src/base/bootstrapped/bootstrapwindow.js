/*
 * Load LibX code, per window
 */
 
libx.log.write("bootstrapping per-window libx from: " + bootStrapper.baseURL);
var files = [
    "window/shared/libapp.js",
    "window/shared/autosense.js",
    "window/shared/libappbuilder.js"
];

for (var i = 0; i < files.length; i++) {
    bootStrapper.loadScript(bootStrapper.baseURL + files[i]);
}

bootStrapper.finish();

libx.events.addListener("ContentLoaded", {
    onContentLoaded: function (event) {
        var ev = event.nativeEvent;
        libx.log.write("page visit: ev.originalTarget.location=" + ev.originalTarget.location);
    }
}, window);

