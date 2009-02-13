
load("../libx2/base/atomparser.js");

var rootPackage = "http://libx.org/libx-new/src/libapproot/libxcore";
var atomParser = new libx.libapp.PackageWalker(rootPackage);

var MyVisitorClass = libx.core.Class.create(libx.libapp.PackageVisitor, {
    onpackage: function (pkg) {
        println("pkg: " + libx.utils.types.dumpObject(pkg));
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
        this.parent(module);
    }
});

var myVisitor = new MyVisitorClass();

atomParser.walk(myVisitor);

println("waiting for stuff to finish...");
java.lang.Thread.sleep(3000);

