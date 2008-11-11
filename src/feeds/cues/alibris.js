// alibris.com
new libxEnv.doforurls.DoForURL(/\.alibris\.com\//, function (doc, match) {
    var isbnLinks = $("a[href*='isbn']");

    for (var i = 0; i < isbnLinks.length; i++) {
        var isbnLink = isbnLinks[i];
        var href = isbnLink.getAttribute('href');
        var isbn, isbnMatch = href.match(/isbn\/((\d|X){10,13})/i);
        if ((isbn = isISBN(isbnMatch[1], libx.edition.catalogs.default.downconvertisbn13)) != null) 
        {
            var cue = libxEnv.makeLink(doc, 
                libxEnv.getProperty("isbnsearch.label", 
                [libx.edition.catalogs.default.name, isbn]), libx.edition.catalogs.default.linkByISBN(isbn), 
                libx.edition.catalogs.default);

            createXISBNTooltip(cue, isbn, libx.edition.catalogs.default.name);

            //Allows the following fadeIn effect to work
            toShowJQ = $(isbnLink).next().before(cue);
            $(isbnLink).next().after(doc.createTextNode(" "));
            animateCue(isbnLink);
        }
    }
}, null, "alibris");
