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

        var isbn = isISBN(isbn13Text, libx.edition.catalogs.default.downconvertisbn13);

        if (isbn == null)
            continue;
        var hint = libxEnv.makeLink(doc, 
                    libxEnv.getProperty("isbnsearch.label", [libx.edition.catalogs.default.name, isbn]), 
                    libx.edition.catalogs.default.linkByISBN(isbn), libx.edition.catalogs.default);
        createXISBNTooltip(hint, isbn, libx.edition.catalogs.default.name);
        anode.parentNode.insertBefore(hint, anode.nextSibling);
        animateCue(hint);
    }
}, null, "globalbooksinprint");
