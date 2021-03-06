// --------------------------------------------------------------------------------------------------
// Google results pages
// link to catalog via keyword

new libxEnv.doforurls.DoForURL(/google(\.[a-z]+)?\.[a-z]+\/search.*q=/i, function (doc) {
    var nArray = $("div div[id='prs'] b");
    var nArray2 = $("tr td span[id='sd']"); // old, before Aug 2008

    if (nArray.length > 0)
        var n = nArray[0];
    else
        var n = nArray2[0];
    
    // XXX unify (maybe place 'unsafeWindow' in LibX IE script engine?
    if ( unsafeWindow == null )
        var searchterms = window.document.gs.q.value;   // LibX IE
    else
        var searchterms = unsafeWindow.document.gs.q.value;   // LibX FF
    // google stores its search terms there for its own use

    var link = libxEnv.makeLink(doc, libxEnv.getProperty("catsearch.label", [libx.edition.catalogs.default.name, searchterms]), libx.edition.catalogs.default.makeKeywordSearch(searchterms), libx.edition.catalogs.default);

    n.parentNode.appendChild(link);

    animateCue(link);

}, null, "Google search");

// link to catalog from google print via ISBN
new libxEnv.doforurls.DoForURL(/books.\google\.com\/books\?id/, 
function (doc) {
    var n = libxEnv.xpath.findSingleXML(doc, "//tr/td//text()[contains(.,'ISBN')]");
    var nArray = $("tr > td").filter(":contains('ISBN')");

    var n = nArray[1];
    var nText = $(n).text();
    var m = nText.match(/(\d{9}[X\d])/i);
    var newlink = libxEnv.makeLink(doc, libxEnv.getProperty("isbnsearch.label", [libx.edition.catalogs.default.name, m[1]]), libx.edition.catalogs.default.linkByISBN(m[1]), libx.edition.catalogs.default);
    createXISBNTooltip(newlink, isbn, libx.edition.catalogs.default.name);
    var ns = n.nextSibling;
    cue = n.insertBefore(newlink, ns);
    n.insertBefore(doc.createTextNode(" "), cue);
    animateCue(link);
}, null, "Google books id");

new libxEnv.doforurls.DoForURL(/books.\google\.com\/books\?q/, 
function (doc) {
    // look for links like this: http://books.google.com/books?q=editions:ISBN0786257784&id=dyF7AAAACAAJ
    var n = libxEnv.xpath.findNodesXML(doc, "//a[contains(@href,'editions:ISBN')]");
    nArray = $("a[href*='editions:ISBN']");

    for (var i = 0; i < n.length; i++) {
        var ilink = n[i].getAttribute('href');
        var m = ilink.match(/editions:ISBN(\d{10,13})&/);
        if (m) {
            var newlink = libxEnv.makeLink(doc, libxEnv.getProperty("isbnsearch.label", [libx.edition.catalogs.default.name, m[1]], libx.edition.catalogs.default),
                    libx.edition.catalogs.default.linkByISBN(m[1]));
            createXISBNTooltip(newlink, isbn, libx.edition.catalogs.default.name);
            var ns = n[i].nextSibling;
            n[i].parentNode.insertBefore(newlink, ns);
            n[i].parentNode.insertBefore(doc.createTextNode(" "), ns);i
            animateCue(link);
        }
    }
}, null, "Google books q");

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
    new libxEnv.doforurls.DoForURL(/scholar\.google\.com(.*)\/scholar\?/, rewriteScholarPage);
    new libxEnv.doforurls.DoForURL(/scholar\.google\.ca(.*)\/scholar\?/, rewriteScholarPage);
    new libxEnv.doforurls.DoForURL(/scholar\.google\.co\.uk(.*)\/scholar\?/, rewriteScholarPage);
}
