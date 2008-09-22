// globalbooksinprint.com
new libxEnv.doforurls.DoForURL(/\.globalbooksinprint\.com.*Search/, 
function(doc) {
    var labels = $("tr > td a").filter("[href*='/merge_shared/Details']");

    for (var i = 0; i < labels.length; i++) {
        var anode = labels[i];
        var isbn13 = $(anode).parents().filter(".oddRowSR,.evenRowSR").next().children().contents().filter(":contains('ISBN 13:')");

        if (0 == isbn13.length)
            continue;

        var isbn13Text = isbn13[0].nextSibling.nodeValue;

        var isbn = isISBN(isbn13Text, libraryCatalog.downconvertisbn13);

        if (isbn == null)
            continue;
        var hint = libxEnv.makeLink(doc, 
                    libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]), 
                    libraryCatalog.linkByISBN(isbn), libraryCatalog);
        createXISBNTooltip(hint, isbn, libraryCatalog.name);
        anode.parentNode.insertBefore(hint, anode.nextSibling);
        animateCue(hint);
    }
}, null, "globalbooksinprint");
