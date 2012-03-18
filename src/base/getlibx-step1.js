/* 
 * Bootstrap LibX code for inclusion in popup.html's getlibx.js, when
 * run in clientside mode.
 */

(function() {

function loadFiles(prefix, libxFiles) {
    for (var i = 0; i < libxFiles.length; i++) {
        document.write('<script src="' + prefix + libxFiles[i] + '"></script>\n');
    }
}

var libxFiles0 = [
    "core/global/shared/core.js",
    "core/global/shared/libx.js",
    "getlibx-step2.js"
];

loadFiles("../", libxFiles0);

})();
