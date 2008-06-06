// --------------------------------------------------------------------------------------------------
// Yahoo results pages
// link to catalog via keyword

new libxEnv.doforurls.DoForURL(
	/search\.yahoo\.com\/search.*p=/, function (doc) {
    // last updated 10/16/2007
    var alsotryArray = $("ul[id='atatl']");

    if (0 == alsotryArray.length)
        return;

    var alsotry = alsotryArray[0];

    var searchtermsArray = $("input[id='yschsp']");

    if (0 == searchtermsArray.length)
        return;

    var searchterms = searchtermsArray[0];
    var link = libxEnv.makeLink(doc, libxEnv.getProperty("catsearch.label", [libraryCatalog.name, searchterms]), libraryCatalog.makeKeywordSearch(searchterms), libraryCatalog);

    if (alsotry && searchterms) {
        alsotry.appendChild(link);
        animateCue(link);
    }
});
