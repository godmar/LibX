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
try {
    var isbnNodeArray = $("b:contains('ISBN')");
    var isbnVal = isbnNodeArray[0].nextSibling.nodeValue;

    var isbn = isISBN(isbnVal, libx.edition.catalogs.default.downconvertisbn13);
    var booktitleNodeArray = $(
        "div.buying > h1.parseasinTitle > span#btAsinTitle");
    if (booktitleNodeArray.length == 0) {
        // old style, still used on amazon.ca apparently
        var booktitleNodeArray = $("div.buying > b.sans > span#btAsinTitle");
    }
    var booktitleNode = booktitleNodeArray[0];
    var holdingSpan = $("tbody:has(span.availGreen)");
    // make link and insert after title
    var div = booktitleNode.parentNode;
    var cue = libxEnv.makeLink(doc, 
        libxEnv.getProperty("isbnsearch.label", [libx.edition.catalogs.default.name, isbn]), 
        libx.edition.catalogs.default.linkByISBN(isbn), libx.edition.catalogs.default);
    createXISBNTooltip(cue, isbn, libx.edition.catalogs.default.name);
    //div.insertBefore(cue, booktitleNode.nextSibling);
//    animateCue(cue);

    // Create libxess request
    var libxessRequest = new libxEnv.libxess( "isbn:" + isbn, "isbn", "innopac", "http://addison.vt.edu" );
    var container = $(holdingSpan).prepend ( "<tr><td><div class='toggler' title='LibX is looking for holdings...'<ul></ul></div></td></tr>" );
    $("div.toggler").before(cue);
    animateCue (cue);
    $(document).ready(function() 
    {
        $('div.toggler').toggleElements(
        {
            fxAnmiation:'slide', fxSpeed:'slow', className:'toggler' 
        } );
    } );

    this.callback = function ( xml ) 
    {
        libxEnv.libxessUtils.loadDocumentFromText( xml );
        var dlf = libxEnv.libxessUtils.getDLF();
        libxEnv.libxessUtils.getDC();
        libxEnv.libxessUtils.getISO();
        var entries = libxEnv.libxessUtils.getAtomEntries();
        var holdings = libxEnv.libxessUtils.getAvailability();
        var internalHTML = ""; 
        var availCount = 0;
        for ( var  i = 0; i < holdings.length; i++ )
        {
            if ( holdings[i].status == "Available" ) {
                availCount++;
            }
            internalHTML += "<li style='color:green'>" + holdings[i].toString() +  "</li>";
        }
        var label = "  LibX found " + holdings.length + " holdings ( " + availCount + " available )";
        $("a.toggler").text(label);
        $("div.toggler").attr("title", label);

        var wrapper = $('div.toggler ul');
        $(wrapper).append( internalHTML );
        $("div.toggler li:contains('not available')").css('color', 'red');
    }

    libxessRequest.get( this.callback);
}
catch (e)
{
    libxEnv.writeLog( "Amazon Toggle Cue produced error: " + e );
}

}

// vim ts := 4

