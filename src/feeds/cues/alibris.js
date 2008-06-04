// alibris.com
new libxEnv.doforurls.DoForURL(/\.alibris\.com\//, function (doc, match) {
    var isbnLinks = $("a[href*='isbn']");

    for (var i = 0; i < isbnLinks.length; i++) {
        var isbnLink = isbnLinks[i];
        var href = isbnLink.getAttribute('href');
        var isbn, isbnMatch = href.match(/isbn\/((\d|X){10,13})/i);
        if (isbnMatch != null && (isbn = isISBN(isbnMatch[1])) != null) {
            var cue = libxEnv.makeLink(doc, 
                        libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]), 
                        libraryCatalog.linkByISBN(isbn), libraryCatalog);


            //Allows the following fadeIn effect to work
		toShowJQ = $(isbnLink).after(cue);
        //    toShowJQ = libxEnv.$(isbnLink).next().before(cue);
            $(isbnLink).next().after(doc.createTextNode(" "));

            $(cue).hide();
            //fade in over 10 seconds.
            $(cue).fadeIn(10000);
        }
    }
});
