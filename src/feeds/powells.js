// powells.com
// http://www.powells.com/biblio/1-0743226712-2
function powellsComByISBN(doc, m) 
{
    libxEnv.writeLog("m " + m);
    libxEnv.writeLog("m[2] " + m[2]);
    var isbn = isISBN(m[2]);
    if (isbn == null) {
        libxEnv.writeLog("isbn was null");
        return;
    }
    // Searched for the stock_info id as it is the node immediately before the
    // title node.
    var titleLabel = $("div[@id='stock_info']");

    // Step past the stock_info node, and the following text node, and you
    // will be at the title node.

    //titleLabel = titleLabel[0].nextSibling;
    titleLabel = titleLabel.next();
    libxEnv.writeLog("titleLabel " + titleLabel);

	if (titleLabel) {
        var link = libxEnv.makeLink(doc, 
                libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]), 
                libraryCatalog.linkByISBN(isbn), libraryCatalog);
        // <strong>ISBN:</strong><a suppressautolink>0743226712</a>_SPACE_<CUE>
		//right of title use this: titleLabel.appendChild(link);
	//titleLabel.after( link );
	titleLabel.prepend( link );
       	$(link).show();
	$(link).fadeOut("slow");
	$(link).fadeIn("slow");
        }
}
new libxEnv.doforurls.DoForURL(
	/(\/\/|\.)powells\.com\/biblio\/\d*\-?((\d|x){13})\-?\d*/i, 
	powellsComByISBN);
new libxEnv.doforurls.DoForURL(
	/(\/\/|\.)powells\.com\/biblio\/\d*\-?((\d|x){10})\-?\d*/i, 
	powellsComByISBN);
new libxEnv.doforurls.DoForURL(
	/(\/\/|\.)powells\.com\/.*isbn=((\d|x){10}|(\d|x){13})/i, 
	powellsComByISBN);
new libxEnv.doforurls.DoForURL(
	/(\/\/|\.)powells\.com\/.*:((\d|x){10}|(\d|x){13}):/i, 
	powellsComByISBN);
