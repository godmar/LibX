(function () {
    var suite = libx.testing.createUnitTestSuite("Atom Parser Tests",
        function () {
            load("../base/bootstrapped/global/shared/libapp/atomparser.js");
            return 0;
        });

    suite.addUnitTest("Atom Parser Test",
        function () {
            //var rootPackage = "http://libx.org/libx2/libapps/libxcore";
            // the feed in ~tjwebb tests param passing also
            var rootPackage = "http://libx.org/~tjwebb/dev/libx2/libapps/libxcore";
            var atomParser = new libx.libapp.PackageWalker(rootPackage);
            var test = this;
            var MyVisitorClass = libx.core.Class.create(libx.libapp.PackageVisitor, {
                onpackage: function (pkg) {
                    test.log("pkg: " + libx.utils.types.dumpObject(pkg) + "\n");
                    this.parent(pkg);
                },
                onlibapp: function (libapp) {
                    test.log("libapp: " + libx.utils.types.dumpObject(libapp) + "\n");
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
                        test.log("module: "+ module);
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
            this.WAIT(10);
        },
        { 
            timeout:    30 
        });
})();

