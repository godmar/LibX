// -----------------------------------------------------------------------------
// Link ecampus.com pages to catalog via ISBN
new libxEnv.doforurls.DoForURL(/(\/\/|\.)ecampus\.com.*(\d{9}[\d|X])/i, 
function (doc, match) {
    var origISBNNodeArray = $("a.nolink");
    var origISBNNode = origISBNNodeArray[0];
    var origISBNTextNode = origISBNNodeArray.contents();
    var isbn = origISBNTextNode[0].nodeValue;

    var link = libxEnv.makeLink(doc, libxEnv.getProperty("isbnsearch.label", [libx.edition.catalogs.default.name, isbn]), libx.edition.catalogs.default.linkByISBN(isbn), libx.edition.catalogs.default);
    createXISBNTooltip(link, isbn, libx.edition.catalogs.default.name);
    origISBNNode.appendChild(link);
    animateCue(link);
}, null, "ecampus");
