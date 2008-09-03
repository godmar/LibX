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

    var isbn = isISBN(isbnVal, libraryCatalog.downconvertisbn13);
    var booktitleNodeArray = $(
        "div.buying > h1.parseasinTitle > span#btAsinTitle");
    if (booktitleNodeArray.length == 0) {
        // old style, still used on amazon.ca apparently
        var booktitleNodeArray = $("div.buying > b.sans > span#btAsinTitle");
    }
    var booktitleNode = booktitleNodeArray[0];

    // make link and insert after title
    var div = booktitleNode.parentNode;
    var cue = libxEnv.makeLink(doc, 
        libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]), 
        libraryCatalog.linkByISBN(isbn), libraryCatalog);
    createXISBNTooltip(cue, isbn, libraryCatalog.name);
    div.insertBefore(cue, booktitleNode.nextSibling);
    animateCue(cue);

    // Create libxess request
    var libxessRequest = new libxEnv.libxess( isbn, "isbn", "innopac", "http://addison.vt.edu" );

    var holdingsHTML = 
        "<div class='toggler' title='Libxess is looking for Holdings'><ul></ul></div>";
    $(cue).after( holdingsHTML );
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
        libxEnv.libxessUtils.getMarc();
        libxEnv.libxessUtils.getISO();
        var entries = libxEnv.libxessUtils.getAtomEntries();
	    var holdings = libxEnv.libxessUtils.getAvailability();
     
        var internalHTML = ""; 
        for ( var  i = 0; i < holdings.length; i++ )
        {
            internalHTML += "<li>" + holdings[i].toString() +  "</li>";
        }
        var wrapper = $('div.toggler ul');
        $(wrapper).append( internalHTML );
        var tpanel = $('div.toggler' );
        var toggleLink = $(tpanel).prev();
        $(toggleLink).text( "Libxess found " + holdings.length + " holding" );
    }

    libxessRequest.get( this.callback);

    // Resources (the images in the toggle panel on the page
    // May not work in IE yet
    // Change url to libx.org once resources have been relocated there
    // FACTOR OUT
    var resourceURL = 
        "http://libx.cs.vt.edu/~frostyt/protoCues/feeds/resources/";
    var toggleElementsCSS = libxEnv.resources.getResource( 
        resourceURL + "toggleElements.css", "text" );
    var togglercGIF = libxEnv.resources.getResource(
        resourceURL + "togglerc.gif", "chrome" );
    var togglerchGIF = libxEnv.resources.getResource(
        resourceURL + "togglerch.gif", "chrome" );
    var toggleroGIF = libxEnv.resources.getResource(
        resourceURL + "togglero.gif", "chrome" );
    var togglerohGIF = libxEnv.resources.getResource(
        resourceURL + "toggleroh.gif", "chrome" );
    if ( toggleElementsCSS != null )
    {
        if ( togglercGIF != null )
        {
            toggleElementsCSS = 
                toggleElementsCSS.replace(/togglerc\.gif/g, togglercGIF );
        }
        else
            window.alert( "togglerc missing" );
        if ( togglerchGIF != null )
        {
            toggleElementsCSS =
                toggleElementsCSS.replace(/togglerch\.gif/g, togglerchGIF );
        }
        else
            window.alert( "togglerch missing" );
        if ( toggleroGIF != null )
        {
            toggleElementsCSS =
                toggleElementsCSS.replace(/togglero\.gif/g, toggleroGIF );
        }
        else
            window.alert( "togglero missing" );
        if ( togglerohGIF != null )
        {
            toggleElementsCSS =
                toggleElementsCSS.replace(/toggleroh\.gif/g, togglerohGIF );
        }
        else
            window.alert( "toggleroh missing" );
        libxEnv.insertStyleSheetText( toggleElementsCSS );
    }
    else
        window.alert( "Did not find style sheet" );
}
catch (e)
{
    libxEnv.writeLog( "Amazon Toggle Cue produced error: " + e );
}
}

// vim ts := 4

