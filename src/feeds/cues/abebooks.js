
new libxEnv.doforurls.DoForURL(/(\/\/|\.)abebooks\.com/, function (doc) {
    var n = $("a.isbn");
    var nContents = $("a.isbn").contents();

    if (0 == n.length)
        return;

    for (var i = 0; i < n.length; i++) {

        var isbn = nContents[i].nodeValue;

        if (isbn) {
            var newlink = libxEnv.makeLink(doc,
                libxEnv.getProperty("isbnsearch.label",
                    [libraryCatalog.name, isbn]),
                libraryCatalog.linkByISBN(isbn), libraryCatalog);
            n[i].parentNode.insertBefore(newlink, n[i].nextSibling);
            n[i].parentNode.insertBefore(doc.createTextNode(" "), newlink);
            animateCue(newlink);
        }
    }
});
