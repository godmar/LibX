/*
 * Support for running libapps.
 * Global component.
 */

(function () {


/* This URL will be read from the edition/user configuration.
 * For now, this is where I keep my feeds - ADJUST THIS FOR YOUR TESTING
 */
var libappBase = "http://libx.org/libx2/libapps/";

var rootPackages = [ { url: libappBase + "libxcore" } ];

// This code registers all libapps on browser startup
// Registrations will progress as quickly as the package tree
// can be walked.  It may be the case that an ContentLoaded event
// fires before the walk is complete, resulting in libapps
// not being executed on the first visit.
var RegisterLibappsClass = new libx.core.Class.create(libx.libapp.PackageVisitor, {
    onlibapp: function (libapp) {
        libx.libapp.loadedLibapps.push(libapp);
        libx.log.write("registered libapp: " + libapp.description, "libapp");
    }
});
var registerLibapps = new RegisterLibappsClass();

function loadLibapps(edition) {
    var feeds = edition.localizationfeeds;
    rootPackages = feeds.package || rootPackages;
    
    for (var i = 0; i < rootPackages.length; i++) {
        libx.log.write("Loading root feed from: " + rootPackages[i].url);
        new libx.libapp.PackageWalker(rootPackages[i].url).walk(registerLibapps);
    }
}

if (libx.edition != null) {
    loadLibapps(libx.edition);
} else {
    libx.events.addListener("EditionConfigurationLoaded", {
        onEditionConfigurationLoaded: function (event) {
            loadLibapps(event.edition);
        }
    });
}

}());
