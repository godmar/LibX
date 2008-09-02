var amazonAction = 
new libxEnv.doforurls.DoForURL(/amazon\.com\//, doAmazon);
var amazonUkAction = 
new libxEnv.doforurls.DoForURL(/amazon\.co\.uk\//, doAmazon);
var amazonCaAction = 
new libxEnv.doforurls.DoForURL(/amazon\.ca\//, doAmazon);
var amazonDeAction = 
new libxEnv.doforurls.DoForURL(/amazon\.de\//, doAmazon);
var amazonFrAction = 
new libxEnv.doforurls.DoForURL(/amazon\.fr\//, doAmazon);
    
// revised Apr 4, 2007
function doAmazon(doc, match) {
    var isbnNodeArray = $("b:contains('ISBN')");

    var isbnVal = isbnNodeArray[0].nextSibling.nodeValue;

    var isbn = isISBN(isbnVal, libraryCatalog.downconvertisbn13);
    var booktitleNodeArray = $("div.buying > h1.parseasinTitle > span#btAsinTitle");
    if (booktitleNodeArray.length == 0) {
        // old style, still used on amazon.ca apparently
        var booktitleNodeArray = $("div.buying > b.sans > span#btAsinTitle");
    }

    var booktitleNode = booktitleNodeArray[0];

    // extract book title
    var booktitle = $(booktitleNode).text();
    // some books, say freakonomics, include in the name [ROUGHCUT] and (HardCover), remove those
    booktitle = booktitle.replace(/\(Hardcover\)/i, "").replace(/\[[^\]]*\]/, "").replace(/\s*$/, "").replace(/^\s*/, "");
    // III is known to not handle punctuation chars, such as :
    if (libraryCatalog.url.toString().indexOf("encore") != -1) {
        booktitle = booktitle.replace(/:/, " ");
    }

    // if catalog supports ISBN, link by ISBN
    // else try 'by Title' (t), then 'by Keyword' (Y)
    var options = ";" + libraryCatalog.options + ";";
    if (options.indexOf(";i;") != -1) {
        var targeturl = libraryCatalog.linkByISBN(isbn);
    } else
    if (options.indexOf(";t;") != -1) {
        var targeturl = libraryCatalog.makeSearch("t", booktitle);
    } else
    if (options.indexOf(";Y;") != -1) {
        var targeturl = libraryCatalog.makeSearch("Y", booktitle);
    }

    var cue = libxEnv.makeLink(doc, 
        libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]), 
        targeturl, libraryCatalog);

    createXISBNTooltip(cue, isbn, libraryCatalog.name);

    // make link and insert after title
    var div = booktitleNode.parentNode;
    div.insertBefore(cue, booktitleNode.nextSibling);
    animateCue(cue);
}

// vim ts := 4
