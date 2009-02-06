// draft unit tests for interpreting AtomPub feeds
//
libx.cache.globalMemoryCache.get({
    url : "http://libx.cs.vt.edu/~gback/feeds-draft.xml",
    dataType : "xml",
    async : true,
    success : function (xmlDoc, status, xhr) {
        var nsResolver = { atom: "http://www.w3.org/2005/Atom",
                           libx2: "http://libx.org/xml/libx2" };
        
        // print all nodes that match a given xpathExpr
        function printNodes(what, xpathExpr) {
            var nodes = libx.utils.xpath.findNodesXML(xmlDoc, xpathExpr, xmlDoc, nsResolver);
            for (var i = 0; i < nodes.length; i++)
                logger.write("found " + what + ": " + nodes[i].nodeValue + "\n");
        }

        // select text beneath an atom:title element that is a child of such atom:entry elements
        // that have a child libx2:module which in turn has a child libx2:body
        printNodes("Libx module", "//atom:entry[libx2:module/libx2:body]/atom:title/text()");
        printNodes("Libx libapp", "//atom:entry[libx2:libapp]/atom:title/text()");
        printNodes("Libx package", "//atom:entry[libx2:package]/atom:title/text()");

        var libapps = libx.utils.xpath.findNodesXML(xmlDoc, "//atom:entry/libx2:libapp", xmlDoc, nsResolver);
        for (var i = 0; i < libapps.length; i++) {
            logger.write("Found libapp: " + libx.utils.xpath.findSingleXML(xmlDoc, 
                                            "preceding-sibling::atom:title/text()", 
                                            libapps[i], nsResolver).nodeValue + "\n");

            var entries = libx.utils.xpath.findNodesXML(xmlDoc, "./libx2:entry", libapps[i], nsResolver);
            for (var j = 0; j < entries.length; j++)
                logger.write(" -> " + entries[j].getAttribute('src') + "\n");
        }
    }
});

logger.write("waiting 2 sec for atompub tests to complete\n");
java.lang.Thread.sleep(2000);
