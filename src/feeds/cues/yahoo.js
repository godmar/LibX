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
    var link = libxEnv.makeLink(doc, libxEnv.getProperty("catsearch.label", [libx.edition.catalogs.default.name, searchterms]), libx.edition.catalogs.default.makeKeywordSearch(searchterms), libx.edition.catalogs.default);

    if (alsotry && searchterms) {
        alsotry.appendChild(link);
        animateCue(link);
    }
});
