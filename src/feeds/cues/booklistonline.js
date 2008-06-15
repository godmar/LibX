// on the booklistonline page, replace the link to worldcatlibraries 
// with a local link.  Suggested by Melissa Belvadi
new libxEnv.doforurls.DoForURL(/booklistonline\.com.*show_product/, 
function (doc) {
    var n = libxEnv.xpath.findNodes(doc, "//a[contains(@href,'worldcatlibraries')]");
    for (var i = 0; i < n.length; i++) {
        var isbn = isISBN(n[i].textContent);
        if (isbn) {
            var newlink = libxEnv.makeLink(doc,
                libxEnv.getProperty("isbnsearch.label",
                    [libraryCatalog.name, isbn]),
                libraryCatalog.linkByISBN(isbn));

            createXISBNTooltip(newlink, isbn, libraryCatalog.name);

            n[i].parentNode.insertBefore(newlink, n[i]);
            n[i].parentNode.insertBefore(doc.createTextNode(" "), n[i]);
            // uncomment this to remove the worldcatlibraries link
            // n[i].parentNode.removeChild(n[i]);
        }
    }
});

// vim: ts=4
