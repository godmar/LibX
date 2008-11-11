// chapters.ca or chapters.indigo.ca
// the URL appears to embed both a ISBN-13 and an ISBN - look for "ISBN:" instead
new libxEnv.doforurls.DoForURL(/chapters\..*\.ca\//, function (doc) {

    var isbnlabel = $("label:contains('ISBN - 13:')");
    if (isbnlabel.length == 0)
        isbnlabel = $("label:contains('ISBN - 10:')");
    if (isbnlabel.length == 0)
        isbnlabel = $("label:contains('ISBN:')");

    isbnLabelText = isbnlabel[0].nextSibling.nodeValue;

    var isbn = isISBN(isbnLabelText, libx.edition.catalogs.default.downconvertisbn13);
    if (isbn) {
        var link = libxEnv.makeLink(doc,
                libxEnv.getProperty("isbnsearch.label", [libx.edition.catalogs.default.name, isbn]),
                libx.edition.catalogs.default.linkByISBN(isbn), libx.edition.catalogs.default);

        createXISBNTooltip(link, isbn, libx.edition.catalogs.default.name);

        // place this link prominently by the booktitle
        var t = $("div[id=itemProductHeading] > h1");

        if (0 == t.length)
            return;

        t[0].insertBefore(link, t[0].firstChild);
        t[0].insertBefore(doc.createTextNode(" "), link);
        animateCue(link);
    } 
}, null, "chapters");
