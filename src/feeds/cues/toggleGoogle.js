// --------------------------------------------------------------------------------------------------
// Google results pages
// link to catalog via keyword

new libxEnv.doforurls.DoForURL(/google\.[a-z]+\/search.*q=/i, function (doc) {
    var nArray = $("tr td span[id='sd']");
    var nArray = $("div div[id='prs']");
    n = nArray[0];
    
    // XXX unify (maybe place 'unsafeWindow' in LibX IE script engine?
    if ( unsafeWindow == null )
        var searchterms = window.document.gs.q.value;   // LibX IE
    else
        var searchterms = unsafeWindow.document.gs.q.value;   // LibX FF
    // google stores its search terms there for its own use

    var link = libxEnv.makeLink(doc, libxEnv.getProperty("catsearch.label", [libraryCatalog.name, searchterms]), libraryCatalog.makeKeywordSearch(searchterms), libraryCatalog);

    n.appendChild(link);

    animateCue(link);


// Create link for libxess search results;
    var libxResultsWrapper = "<a class='toggler' title='Libxess is looking for Results' href=''>Libxess is looking for Results</a>";
    var wrapper = $(n).append(libxResultsWrapper);

	// Show the specified number of children, starting at offset start
    function show (  start ) {
        $(".libxessResult").hide();
        $(".libxessResult" + start ).show();
        $(".libxessNavDiv a").css({ color: 'grey', fontWeight: 'normal' }  );
        $(".libxessNavDiv a[count='" + start + "']" ).css ( { color: 'black', fontWeight: 'bold' }  );
    }

    // Jquery toggle functionality for the results
    $(document).ready(function()
    {
        $('a.toggler').toggle(
        function () {
            $('div.libxessResults').slideDown();
            $('div.libxessNavDiv').slideDown();
            show ( 0 );
        },
        function() {
            $('div.libxessResults').slideUp();
            $('div.libxessNavDiv').slideUp();
        });
    });


    // create libxess request
    var libxessRequest = new libxEnv.libxess( searchterms, "keyword", "innopac",
        "http://addison.vt.edu" ); 

    // callback for the request. Creates the list of results from the feed
    this.callback = function ( xml ) 
    {
        libxEnv.libxessUtils.loadDocumentFromText( xml );
        var entries = libxEnv.libxessUtils.getAtomEntries();
        // wrap li's in ul
        $("div[id='res']").prepend ( "<div class=\"libxessResults\" style=\"display: none;\"></div>" );
        $("div[id='res']").prepend ( "<div class='libxessNavDiv' style='display:none;'></div>" );
        
        // Create one tab link every 10 entries
        for ( var i = 0; i < entries.length / 10; i++ ) {
            var end = ( i + 1 ) * 10;
            if ( end > entries.length ) {
                 end = entries.length;
            }
            var a = document.createElement ('a');
            $(a).attr('count', i );
            $(a).text ( i*10 + "-" + end + "  " );
            $(a).click ( function () {
                show ( $(this).attr("count") );
            } );
            $('div.libxessNavDiv').append(a);
        }

        for ( var i = 0; i < entries.length; i++ )
        {
            libxEnv.libxessUtils.getDLFforEntry( entries[i] );
            libxEnv.libxessUtils.getDC();
            var href = "http://addison.vt.edu/record=" + libxEnv.libxessUtils.getDLFID();
            var title = libxEnv.libxessUtils.getDCTitle();
            $('div.libxessResults').append (  "<li class='libxessResult libxessResult" + parseInt ( i / 10 ) + "'><a href='" + href + "'>" + title +
                "</a></li>" );
        }
        var wrapper = $("a[@class='toggler']");

        var total = entries.length;
        $(wrapper).text( "Libxess Found " + total + " results" );
        $(wrapper).attr( 'title', 'Libxess Found ' + total + ' results' );

    }
    libxessRequest.get(this.callback);

});

// link to catalog from google print via ISBN
new libxEnv.doforurls.DoForURL(/books.\google\.com\/books\?id/, 
function (doc) {
    var n = libxEnv.xpath.findSingleXML(doc, "//tr/td//text()[contains(.,'ISBN')]");
    var nArray = $("tr > td").filter(":contains('ISBN')");

    var n = nArray[1];
    var nText = $(n).text();
    var m = nText.match(/(\d{9}[X\d])/i);
    var newlink = libxEnv.makeLink(doc, libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, m[1]]), libraryCatalog.linkByISBN(m[1]), libraryCatalog);
    createXISBNTooltip(newlink, isbn, libraryCatalog.name);
    var ns = n.nextSibling;
    cue = n.insertBefore(newlink, ns);
    n.insertBefore(doc.createTextNode(" "), cue);
    animateCue(link);
});

new libxEnv.doforurls.DoForURL(/books.\google\.com\/books\?q/, 
function (doc) {
    // look for links like this: http://books.google.com/books?q=editions:ISBN0786257784&id=dyF7AAAACAAJ
    var n = libxEnv.xpath.findNodesXML(doc, "//a[contains(@href,'editions:ISBN')]");
    nArray = $("a[href*='editions:ISBN']");

    for (var i = 0; i < n.length; i++) {
        var ilink = n[i].getAttribute('href');
        var m = ilink.match(/editions:ISBN(\d{10,13})&/);
        if (m) {
            var newlink = libxEnv.makeLink(doc, libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, m[1]], libraryCatalog),
                    libraryCatalog.linkByISBN(m[1]));
            createXISBNTooltip(newlink, isbn, libraryCatalog.name);
            var ns = n[i].nextSibling;
            n[i].parentNode.insertBefore(newlink, ns);
            n[i].parentNode.insertBefore(doc.createTextNode(" "), ns);i
            animateCue(link);
        }
    }
});

// rewrite OpenURLs on Google Scholar's page to show cue
if (libxEnv.openUrlResolver && libxEnv.options.rewritescholarpage) {
 function rewriteScholarPage(doc, proxy) {
    var atags = $("a[href]");
    
    for (var i = 0; i < atags.length; i++) {
        var link = atags[i];
        var p = decodeURIComponent(link.href);
        var m = p.match(/.*\?sid=google(.*)$/);

        // should match scholar viewed through WAM-proxy as well

        // do not rewrite Refworks link
        if (m && (m[0].match(/\.refworks\.com/) == null)) {
            var ourl = libxEnv.openUrlResolver.completeOpenURL(m[1], "0.1");
            var newlink = libxEnv.makeLink(doc, libxEnv.getProperty("openurllookup.label", [libxEnv.openUrlResolver.name]), ourl, libxEnv.openUrlResolver);
            link.parentNode.insertBefore(newlink, link.nextSibling);
            link.parentNode.insertBefore(doc.createTextNode(" "), 
                link.nextSibling); 
            animateCue( newlink );
            // this would remove the "Get VText" link Scholar places link.parentNode.removeChild(link);
        }
    }
 }
 new libxEnv.doforurls.DoForURL(/scholar\.google\.com(.*)\/scholar\?/, 
	rewriteScholarPage);
}
