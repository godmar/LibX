var amazonAction = 
new libxEnv.doforurls.DoForURL(/amazon\.com\//, doAmazon, null, "Amazon");
var amazonUkAction = 
new libxEnv.doforurls.DoForURL(/amazon\.co\.uk\//, doAmazon, null, "Amazon United Kingdom");
var amazonCaAction = 
new libxEnv.doforurls.DoForURL(/amazon\.ca\//, doAmazon, null, "Amazon Canada");
var amazonDeAction = 
new libxEnv.doforurls.DoForURL(/amazon\.de\//, doAmazon, null, "Amazon Germany");
var amazonFrAction = 
new libxEnv.doforurls.DoForURL(/amazon\.fr\//, doAmazon, null, "Amazon France");
    
// revised Apr 4, 2007
function doAmazon(doc, match) {
    var isbnNodeArray = $("b:contains('ISBN')");

    var isbnVal = isbnNodeArray[0].nextSibling.nodeValue;

    var isbn = isISBN(isbnVal, libx.edition.catalogs.default.downconvertisbn13);
    var booktitleNodeArray = $("div.buying > h1.parseasinTitle > span#btAsinTitle");
    if (booktitleNodeArray.length == 0) {
        // amazon.ca uses this
        var booktitleNodeArray = $("div.buying > h1.parsesans > span#btAsinTitle");
    }

    var booktitleNode = booktitleNodeArray[0];

    // extract book title
    var booktitle = $(booktitleNode).text();
    // some books, say freakonomics, include in the name [ROUGHCUT] and (HardCover), remove those
    booktitle = booktitle.replace(/\(Hardcover\)/i, "").replace(/\[[^\]]*\]/, "").replace(/\s*$/, "").replace(/^\s*/, "");
    // III is known to not handle punctuation chars, such as :
    if (libx.edition.catalogs.default.url.toString().indexOf("encore") != -1) {
        booktitle = booktitle.replace(/:/, " ");
    }

    // if catalog supports ISBN, link by ISBN
    // else try 'by Title' (t), then 'by Keyword' (Y)
    var options = ";" + libx.edition.catalogs.default.options + ";";
    if (options.indexOf(";i;") != -1) {
        var targeturl = libx.edition.catalogs.default.linkByISBN(isbn);
    } else
    if (options.indexOf(";t;") != -1) {
        var targeturl = libx.edition.catalogs.default.makeSearch("t", booktitle);
    } else
    if (options.indexOf(";Y;") != -1) {
        var targeturl = libx.edition.catalogs.default.makeSearch("Y", booktitle);
    }

    var cue = libxEnv.makeLink(doc, 
        libxEnv.getProperty("isbnsearch.label", [libx.edition.catalogs.default.name, isbn]), 
        targeturl, libx.edition.catalogs.default);

    createXISBNTooltip(cue, isbn, libx.edition.catalogs.default.name);

    // make link and insert after title
    var div = booktitleNode.parentNode;
    div.insertBefore(cue, booktitleNode.nextSibling);
    animateCue(cue);
}

// vim ts := 4
