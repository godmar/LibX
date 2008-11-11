// --------------------------------------------------------------------------------------------------
// Link Barnes & Noble pages to catalog via ISBN
var bnFunction = function (doc, match) {
    var isbn = isISBN(match[1], libx.edition.catalogs.default.downconvertisbn13);    // grab captured isbn in matched URL
    
    // last verified Jul 25, 2008
    var origTitleNodeArray = $("div#product-info").find("h1");

    var origTitleNode = origTitleNodeArray[0];
    
    // make link and insert after title
    var link = libxEnv.makeLink(doc, libxEnv.getProperty("isbnsearch.label", [libx.edition.catalogs.default.name, isbn]), libx.edition.catalogs.default.linkByISBN(isbn), libx.edition.catalogs.default);
    createXISBNTooltip(link, isbn, libx.edition.catalogs.default.name);

    var parent = $(origTitleNode).contents().eq(0);
    parent.before(doc.createTextNode(" "));
    parent.before(link);
    animateCue(link);
}

// as in http://search.barnesandnoble.com/booksearch/isbnInquiry.asp?z=y&isbn=9780060788704&itm=1
new libxEnv.doforurls.DoForURL(
    /\.barnesandnoble\.com.*(?:EAN|isbn)=(\d{7,12}[\d|X])/i, bnFunction, null, "Barnes & Noble 1");
// as in http://search.barnesandnoble.com/The-Outlaw-Demon-Wails/Kim-Harrison/e/9780060788704/?itm=1
new libxEnv.doforurls.DoForURL(
    /\.barnesandnoble\.com.*\/(\d{10,12}[\d|X])\//i, bnFunction, null, "Barnes & Noble 2");
