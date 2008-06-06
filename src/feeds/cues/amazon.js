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

    if (0 == isbnNodeArray.length)
        return;

    var isbnVal = isbnNodeArray[0].nextSibling.nodeValue;

    var isbn = isISBN(isbnVal);
    var booktitleNodeArray = $(
        "div.buying > h1.parseasinTitle > span#btAsinTitle");

    if (0 == booktitleNodeArray.length)
        return;

    var booktitleNode = booktitleNodeArray[0];
    

    // make link and insert after title
    var div = booktitleNode.parentNode;
    var cue = libxEnv.makeLink(doc, 
                        libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]), 
                        libraryCatalog.linkByISBN(isbn), libraryCatalog);

    div.insertBefore(cue, booktitleNode.nextSibling);
    try {
        animateCue(cue);
    }
    catch (ex) {
	libxEnv.writeLog( "Caught exception when fading in cue " + ex );
	for ( prop in ex )
		libxEnv.writeLog( "ex." + prop + " " + ex[prop] );
    }
}

// vim ts := 4
