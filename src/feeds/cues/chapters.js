// chapters.ca or chapters.indigo.ca
// the URL appears to embed both a ISBN-13 and an ISBN - look for "ISBN:" instead
new libxEnv.doforurls.DoForURL(/chapters\..*\.ca\//, function (doc) {
    var isbnlabel = $("label:contains('ISBN:')");

    if (0 == isbnlabel.length)
        return;

    isbnLabelText = isbnlabel[0].nextSibling.nodeValue;

	var isbn = isISBN(isbnLabelText);
	if (isbn) {
		var link = libxEnv.makeLink(doc,
				libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]),
				libraryCatalog.linkByISBN(isbn), libraryCatalog);
		// place this link prominently by the booktitle
		var t = $("div[id=itemProductHeading] > h1");

		if (0 == t.length)
			return;

		t[0].insertBefore(link, t[0].firstChild);
		t[0].insertBefore(doc.createTextNode(" "), link);
        animateCue(link);
	} 
});
