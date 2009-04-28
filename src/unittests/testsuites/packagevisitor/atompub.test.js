// test the atompub parser
//
(function () {
// define globals:
var success;

var pkgVisitorTest = libx.core.Class.create(TestCase, {
    setUp: function () {
        success = false;
        libx.cache.defaultMemoryCache.get({
            url : "http://libx.org/libx2/libapps/",
            dataType : "xml",
            async : true,
            success : function (xmlDoc, status, xhr) {
                var nsResolver = { 
                    atom: "http://www.w3.org/2005/Atom",
                    libx2: "http://libx.org/xml/libx2" 
                };
                // print all nodes that match a given xpathExpr
                function printNodes(what, xpathExpr) {
                    var nodes = libx.utils.xpath.findNodesXML(xmlDoc, xpathExpr, xmlDoc, nsResolver);
                    for (var i = 0; i < nodes.length; i++)
                        print("found " + what + ": " + nodes[i].nodeValue + "\n");
                }

                // select text beneath an atom:title element that is a child of such atom:entry elements
                // that have a child libx2:module which in turn has a child libx2:body
                printNodes("Libx package", "//atom:entry[libx2:package]/atom:title/text()");

                var libapps = libx.utils.xpath.findNodesXML(xmlDoc, "//atom:entry/libx2:libapp", xmlDoc, nsResolver);
                for (var i = 0; i < libapps.length; i++) {
                    print("Libapp: " + libx.utils.xpath.findSingleXML(xmlDoc, 
                                                    "preceding-sibling::atom:title/text()", 
                                                    libapps[i], nsResolver).nodeValue + "\n");

                    var entries = libx.utils.xpath.findNodesXML(xmlDoc, "./libx2:entry", libapps[i], nsResolver);
                    for (var j = 0; j < entries.length; j++)
                        print(" -> " + entries[j].getAttribute('src') + "\n");
                }
                success = true;
            }
        });
        java.lang.Thread.sleep(3000);
    },

    testSuccess: function() {
        this.assertTrue(success);
    },

    // constructor, calls superclass constructor such as the 'nName' is set to 'name'
    initialize : function (name) {
        TestCase.call(this, name);
    },

    // used when "println('...' + test)" is called
    toString : function () {
        return "packageVisitorTest";
    }
});

// ---
// test suite setup code
packagevisitorTestSuite = libx.core.Class.create(TestSuite, {
    initialize: function () {
        TestSuite.call(this, "packagevisitorTestSuite");
        this.addTestSuite(pkgVisitorTest);
    },
    suite: function () {
        return new packagevisitorTestSuite(); 
    }
});

// now add test suite to current list/global list etc.
// addTest(/* prefix= */"packagevisitor")

})();
