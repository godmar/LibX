//
// testing text explorer
//
load ("../libx2/base/bitvector.js");
load ("../libx2/base/textexplorer.js");
load ("../libx2/base/texttransformer.js");

var textTransformer = new libx.libapp.RegexpTextTransformer(/(\d{9,12}[\dX])/ig);
textTransformer.onMatch = function (textNode, m) {
    var isbn = libx.utils.stdnumsupport.isISBN(m[0], false);
    if (!isbn)
        return null;

    var doc = textNode.ownerDocument;
    var a = doc.createElement("a");
    a.setAttribute('href', 'somewhere....');
    a.appendChild(doc.createTextNode(m[0]));
    return [ a, function (node) {
        node.setAttribute('title', 'Search ...');
    }];
};

var xmlDoc;
libx.cache.globalMemoryCache.get({
    dataType : "xml",
    url : "http://libx.cs.vt.edu/~gback/jquery/testdoc.xhtml",
    success : function (xml, status, xhr) {
        xmlDoc = xml;

        var exp = new libx.libapp.TextExplorer(1000000, 0);
        exp.addTextTransformer(textTransformer);
        exp.addTextTransformer({
            skippedElements : {
                a : 1
            },

            libx : /(libx)/ig,
            processNode : function (node) {
                var text = String(node.data);
                if (!this.libx.test(text))
                    return null;
                return [ node.ownerDocument.createTextNode(text.replace(this.libx, "$1 (it rocks)")) ];
            }
        });
    
        exp.traverse(xml.documentElement);
    }
});

// XML parsing is very slow, possibly due to startup overhead
println("sleeping for 5000ms");
java.lang.Thread.sleep(5000);

println(xmlDoc.saveXML(xmlDoc.documentElement));
