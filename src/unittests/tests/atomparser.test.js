(function () {
    load("testing.js");
    libx.testing.createUnitTestSuite({ 
        name: "atom parser",
        setup: function () {
            load("../base/bootstrapped/global/shared/libapp/atomparser.js");
            return 0;
        }
    });
    libx.testing.addUnitTest({
        suiteName:  "atom parser",
        funcName:   "atom parser",
        timeout:    30,
        testFunction: function () {
            //var rootPackage = "http://libx.org/libx2/libapps/libxcore";
            // the feed in ~tjwebb tests param passing also
            var rootPackage = "http://libx.org/~tjwebb/dev/libx2/libapps/libxcore";
            var atomParser = new libx.libapp.PackageWalker(rootPackage);
            var MyVisitorClass = libx.core.Class.create(libx.libapp.PackageVisitor, {
                onpackage: function (pkg) {
                    //println("pkg: " + libx.utils.types.dumpObject(pkg));
                   // println("  " + libx.utils.types.dumpObject(pkg.entries[0]));
                    this.parent(pkg);
                },
                onlibapp: function (libapp) {
                    //println("args: "+ libx.utils.types.dumpObject(libapp.args));
                    /*
                    if (libapp.description == "Libx2 param passing test app")
                        libx.testing.methods.ASSERT_EQUAL(
                            libapp.args.x.value,
                            "value passed in from libxcore"
                        );
                        */
                    this.parent(libapp);
                },
                onmodule: function (module) {
                    if (module.description == "test parameter passing") {
                        /*
                        if (module.args.x)
                            libx.testing.methods.ASSERT_EQUAL(
                                module.args.x.value,
                                "value passed in from libxcore"
                            );
                        if (module.args.y)
                            libx.testing.methods.ASSERT_EQUAL(
                                module.args.y.value,
                                [1, 2, 3]
                            );
                        if (module.args.a)
                            libx.testing.methods.ASSERT_EQUAL(
                                module.args.a.value, "true"
                            );
                            */

                    }
                    //println("module: " + libx.utils.types.dumpObject(module));
                    for (var i = 0; i < module.include.length; i++) {
                        //println(" include: " + module.include[i]);
                    }
                    for (var i = 0; i < module.guardedby.length; i++) {
                        //println(" guardedby: " + module.guardedby[i]);
                    }
                    //println("module.id: " + module.id);
                    //println("module.body: " + module.body.match(/^.*\n.*\n.*\n/));
                    this.parent(module);
                }
            });
            var myVisitor = new MyVisitorClass();
            atomParser.walk(myVisitor);
            libx.testing.methods.WAIT(10);
        }
    });
})();

