//
// testing text explorer
//
load ("../libx2/base/vector.js");
load ("../libx2/base/textexplorer.js");

var textTransformer = {
    skippedElements : {
        a : 1
    },

    processNode : function (node) {
        var text = libx.utils.string.trim(String(node.nodeValue));
        // println("processing: " + text);
        var m = text.match(/(\d{9,12}[\dX])/i);
        if (!m)
            return null;
        var isbn = libx.utils.stdnumsupport.isISBN(m[0], false);
        if (!isbn)
            return null;

        var doc = node.ownerDocument;
        var l = text.indexOf(m[0]);
        var left = doc.createTextNode(text.substr(0, l));
        var right = doc.createTextNode(text.substr(l + m[0].length));
        var a = doc.createElement("a");
        a.setAttribute('href', 'somewhere....');
        a.appendChild(doc.createTextNode(m[0]));
        return [left, a, right];
    }
};

var xmlDoc;
libx.cache.defaultMemoryCache.get({
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
                var text = libx.utils.string.trim(String(node.nodeValue));
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
