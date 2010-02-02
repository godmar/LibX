load("../libx2/base/atomparser.js");
var rootPackage = "http://libx.cs.vt.edu/~tjwebb/libxcore";
//var rootPackage = "http://libx.org/libx2/libapps/searchbyisbn";
var atomParser = new libx.libapp.PackageWalker(rootPackage);

var MyVisitorClass = libx.core.Class.create(libx.libapp.PackageVisitor, {
    onpackage: function (pkg) {
        println("pkg: " + libx.utils.types.dumpObject(pkg));
        println("  " + libx.utils.types.dumpObject(pkg.entries[0]));
        this.parent(pkg);
    },
    onlibapp: function (libapp) {
        println("libapp: " + libx.utils.types.dumpObject(libapp));
        this.parent(libapp);
    },
    onmodule: function (module) {
        println("module: " + module.description);
        for (var i = 0; i < module.include.length; i++) {
            println(" include: " + module.include[i]);
        }
        for (var i = 0; i < module.guardedby.length; i++) {
            println(" guardedby: " + module.guardedby[i]);
        }
        println("module.id: " + module.id);
        println("module.body: " + module.body.match(/^.*\n.*\n.*\n/));
        this.parent(module);
    }
});

var myVisitor = new MyVisitorClass();
atomParser.walk(myVisitor);

println("waiting for stuff to finish...");
java.lang.Thread.sleep(6000);
