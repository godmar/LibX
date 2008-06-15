// --------------------------------------------------------------------------------------------------
// Yahoo results pages
// link to catalog via keyword

new libxEnv.doforurls.DoForURL(
	/search\.yahoo\.com\/search.*p=/, function (doc) {
    // last updated 6/15/2008
    var alsotryArray = $("ul[id='atatl']");

    var alsotry = alsotryArray[0];

    var searchtermsArray = $("input[id='yschsp']");

    var searchterms = searchtermsArray[0].value;
    var link = libxEnv.makeLink(doc, libxEnv.getProperty("catsearch.label", [libraryCatalog.name, searchterms]), libraryCatalog.makeKeywordSearch(searchterms), libraryCatalog);

    if (alsotry && searchterms) {
        alsotry.appendChild(link);
        animateCue(link);
    }
});
