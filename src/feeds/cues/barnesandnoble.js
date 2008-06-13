// --------------------------------------------------------------------------------------------------
// Link Barnes & Noble pages to catalog via ISBN
var bnFunction = function (doc, match) {
    var isbn = isISBN(match[1], libraryCatalog.downconvertisbn13);    // grab captured isbn in matched URL
    
    // last verified Mar 02, 2008
    var origTitleNodeArray = $("div#product-info").find("h2");

    var origTitleNode = origTitleNodeArray[0];
    
    // make link and insert after title
    var link = libxEnv.makeLink(doc, libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]), libraryCatalog.linkByISBN(isbn), libraryCatalog);
    createXISBNTooltip(link, isbn, libraryCatalog.name);

    $(origTitleNode).contents().eq(0).before(doc.createTextNode(" "));
    $(origTitleNode).contents().eq(0).before(link);
    animateCue(link);
}

// as in http://search.barnesandnoble.com/booksearch/isbnInquiry.asp?z=y&isbn=9780060788704&itm=1
new libxEnv.doforurls.DoForURL(
    /\.barnesandnoble\.com.*(?:EAN|isbn)=(\d{7,12}[\d|X])/i, bnFunction);
// as in http://search.barnesandnoble.com/The-Outlaw-Demon-Wails/Kim-Harrison/e/9780060788704/?itm=1
new libxEnv.doforurls.DoForURL(
    /\.barnesandnoble\.com.*\/(\d{10,12}[\d|X])\//i, bnFunction);
