// --------------------------------------------------------------------------------------------------
// Google results pages
// link to catalog via keyword

new libxEnv.doforurls.DoForURL(/google\.[a-z]+\/search.*q=/i, function (doc) {
    var nArray = $("tr td span[id='sd']");

    n = nArray[0];
    
    // XXX unify (maybe place 'unsafeWindow' in LibX IE script engine?
    if ( unsafeWindow === undefined )
        var searchterms = window.document.gs.q.value;   // LibX IE
    else
        var searchterms = unsafeWindow.document.gs.q.value;   // LibX FF
    // google stores its search terms there for its own use

    var link = libxEnv.makeLink(doc, libxEnv.getProperty("catsearch.label", [libraryCatalog.name, searchterms]), libraryCatalog.makeKeywordSearch(searchterms), libraryCatalog);

    n.parentNode.appendChild(link);

    // XXX why this?  Tobias, please explain or fix
    $(link,unsafeWindow.document).fadeOut("slow");
    $(link,unsafeWindow.document).fadeIn("slow");
    //animateCue(link);

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
            animateCue( link );
            // link.parentNode.removeChild(link);
        }
    }
 }
 new libxEnv.doforurls.DoForURL(/scholar\.google\.com(.*)\/scholar\?/, 
	rewriteScholarPage);
}
