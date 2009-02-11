
load("../libx2/base/atomparser.js");

var rootPackage = "http://libx.org/libx-new/src/libapproot/libxcore";
var atomParser = new libx.libapp.PackageWalker(rootPackage);

function getDesc(pkg) {
    var pkgName = libx.utils.xpath.findSingleXML(pkg.ownerDocument, "preceding-sibling::atom:title/text()", 
            pkg, libx.libapp.nsResolver).nodeValue;
    return pkgName;
}

var MyVisitorClass = libx.core.Class.create(libx.libapp.PackageVisitor, {
    onPackage: function (baseURL, pkg) {
        println("Saw package: base=" + baseURL + " pkg: " + getDesc(pkg));
        this.parent(baseURL, pkg);
    },
    onLibapp: function (baseURL, libapp) {
        println("Saw libapp: base=" + baseURL + " pkg: " + getDesc(libapp));
        this.parent(baseURL, libapp);
    },
    onModule: function (baseURL, module) {
        println("Saw module: base=" + baseURL + " pkg: " + getDesc(module));
        this.parent(baseURL, module);
    }
});

var myVisitor = new MyVisitorClass();

atomParser.walk(myVisitor);

println("waiting for stuff to finish...");
java.lang.Thread.sleep(3000);

