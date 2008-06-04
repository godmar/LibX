//
// Serials Solutions currently (as of 10/20/05) does not implement OpenURLs with genre=book
// and an isbn (despite the fact that doing so is dead simple)
// We help the user by including a direct link to an ISBN-based search.
//
if (libxEnv.openUrlResolver && libxEnv.options.sersolisbnfix) {
    new libxEnv.doforurls.DoForURL(
	/serialssolutions\.com\/(.*genre=book.*)/, 
    function (doc, match) {
        var im = match[1].match(/isbn=([0-9xX]{10,13})/i);
        var isbn;
        if (im && (isbn = isISBN(im[1]))) {
            var h4 = libxEnv.xpath.findSingle(doc, "//h4[contains(text(), 'No direct links were found')]");
            if (h4 == null) {
                h4 = libxEnv.xpath.findSingle(doc, "//h3[contains(text(), 'We do not have enough information')]");
            }
            if (h4 == null) {
                h4 = libxEnv.xpath.findSingle(doc, "//div[contains(@class, 'SS_NoResults')]");
            }
            if (h4 == null)
                return;
            var hint = libxEnv.makeLink(doc, libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]), libraryCatalog.makeISBNSearch(isbn), libraryCatalog);
            var it = doc.createElement("i");
            it.appendChild(doc.createTextNode(" LibX Enhancement: " +  libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn])));

            var par = doc.createElement("p");
            par.appendChild(hint);
            par.appendChild(it);
            h4.parentNode.insertBefore(par, h4);
        }
    });

// fix it up if SerSol thinks it does not have enough information even though a DOI is in the OpenURL
new libxEnv.doforurls.DoForURL(
	/serialssolutions\.com\/.*id=doi:([^&]+)(&|$)/, 
    function (doc, match) {
        var doi = match[1];
        // the first expression is probably obsolete now
        var h3 = libxEnv.xpath.findSingle(doc, "//h3[contains(text(), 'We do not have enough information')]");
        if (!h3) {
            h3 = libxEnv.xpath.findSingle(doc, "//div[contains(@class, 'SS_NoResults')]");
            if (!h3)
                return;
        }
        var hint =  libxEnv.makeLink(doc, "Try dx.doi.org/" + doi,  "http://dx.doi.org/" + doi, libxEnv.openUrlResolver);
        var it = doc.createElement("i");
        it.appendChild(doc.createTextNode(" LibX Enhancement: Try CrossRef for DOI " + doi));
        var par = doc.createElement("p");
        par.appendChild(hint);
        par.appendChild(it);
        h3.parentNode.insertBefore(par, h3);
    });
}
