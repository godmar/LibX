// -----------------------------------------------------------------------------
// Link ecampus.com pages to catalog via ISBN
new libxEnv.doforurls.DoForURL(/(\/\/|\.)ecampus\.com.*(\d{9}[\d|X])/i, 
function (doc, match) {
    var origISBNNodeArray = $("a.nolink");
    var origISBNNode = origISBNNodeArray[0];
    var origISBNTextNode = origISBNNodeArray.contents();
    var isbn = origISBNTextNode[0].nodeValue;

    var link = libxEnv.makeLink(doc, libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]), libraryCatalog.linkByISBN(isbn), libraryCatalog);
    createXISBNTooltip(link, isbn, libraryCatalog.name);
    origISBNNode.appendChild(link);
    animateCue(link);
});
