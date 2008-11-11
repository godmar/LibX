// powells.com
// http://www.powells.com/biblio/1-0743226712-2
function powellsComByISBN(doc, m) 
{
    var isbn = isISBN(m[2], libx.edition.catalogs.default.downconvertisbn13);
    if (isbn == null) {
        return;
    }
    // Searched for the stock_info id as it is the node immediately before the
    // title node.
    var titleLabel = $("div[@id='stock_info']");

    // Step past the stock_info node, and the following text node, and you
    // will be at the title node.

    //titleLabel = titleLabel[0].nextSibling;
    titleLabel = titleLabel.next();

    if (titleLabel) {
        var link = libxEnv.makeLink(doc, 
            libxEnv.getProperty("isbnsearch.label", 
            [libx.edition.catalogs.default.name, isbn]), 
            libx.edition.catalogs.default.linkByISBN(isbn), libx.edition.catalogs.default);
            // <strong>ISBN:</strong><a suppressautolink>0743226712</a>_SPACE_<CUE>
            //right of title use this: titleLabel.appendChild(link);
            //titleLabel.after( link );
        createXISBNTooltip(link, isbn, libx.edition.catalogs.default.name);
        titleLabel.prepend( link );
        animateCue(link);
    }
}
new libxEnv.doforurls.DoForURL(
    /(\/\/|\.)powells\.com\/biblio\/\d*\-?((\d|x){13})\-?\d*/i, 
    powellsComByISBN);
new libxEnv.doforurls.DoForURL(
    /(\/\/|\.)powells\.com\/biblio\/\d*\-?((\d|x){10})\-?\d*/i, 
    powellsComByISBN);
new libxEnv.doforurls.DoForURL(
    /(\/\/|\.)powells\.com\/.*isbn=((\d|x){10}|(\d|x){13})/i, 
    powellsComByISBN);
new libxEnv.doforurls.DoForURL(
    /(\/\/|\.)powells\.com\/.*:((\d|x){10}|(\d|x){13}):/i, 
    powellsComByISBN);
