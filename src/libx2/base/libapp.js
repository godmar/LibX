/*
 * Support for running libapps,
 */

(function () {

var libapps = [];

var RegisterLibappsClass = new libx.core.Class.create(libx.libapp.PackageVisitor, {
    onlibapp: function (libapp) {
        libapps.push(libapp);
        libx.log.write("registered libapp: " + libapp.description);
    }
});
var registerLibapps = new RegisterLibappsClass();

// XXX read this from libx.edition.
var rootPackages = [ "http://libx.org/libx-new/src/libapproot/libxcore" ];
for (var i = 0; i < rootPackages.length; i++) {
    libx.log.write("walking: " + rootPackages[i]);
    new libx.libapp.PackageWalker(rootPackages[i]).walk(registerLibapps);
}

function checkIncludesExcludes(spec, url)
{
    var executeModule = false;
    for (var k = 0; k < spec.include.length; k++) {
        if (spec.include[k].test(url)) {
            executeModule = true;
            break;
        }
    }

    for (var k = 0; executeModule && k < spec.exclude.length; k++) {
        if (spec.exclude[k].test(url)) {
            executeModule = false;
        }
    }

    return executeModule;
}

var observer = {
    onContentLoaded: function (event) {

        libx.log.write("user visited: " + event.url + " " + libx.edition.name.long);
        
        /**
         * Create a new sandbox in which the captured per-XUL-window 
         * 'libx' object appears under the global name 'libx'.
         */
        var sbox = new libx.libapp.Sandbox(event.window, { libx: libx });
/*
        if (event.url.match("libx.cs.vt.edu") != null)
            sbox.evaluate("alert('You\\'re running libx: ' + libx.edition.name.long);");
*/
        for (var i = 0; i < libapps.length; i++) {
            var libapp = libapps[i];
            libapp.space = new libx.libapp.TupleSpace();
            for (var j = 0; j < libapp.entries.length; j++) {
                new libx.libapp.PackageWalker(libapp.entries[i].url).walk({
                    onmodule: function (module) {
                        var executeModule = checkIncludesExcludes(module, event.url);
                        if (!executeModule)
                            return;

                        libx.log.write("executing module: " + module.description);
                    }
                });
            }
        }
    }
}

libx.events.addListener("ContentLoaded", observer, window, "libapploader");

}());
