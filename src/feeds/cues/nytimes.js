// --------------------------------------------------------------------------------------------------
// book review pages on the NY Times website
// link book title to catalog via title
var nytimesAction = new libxEnv.doforurls.DoForURL(/nytimes\.com.*books/, doNyTimes);

function doNyTimes(doc) {
    var n = new Array();
    
    //Try a couple of queries
    var archiveN = $("div[id='sectionPromo'] strong");
    var n = $("div.sectionPromo h4, div[id='sectionPromo'] h4");

    if (0 < archiveN.length) {
        //We found an older version of the page, so handle getting information here
        // see <http://www.nytimes.com/2005/05/15/books/review/15HOLTL.html>
        var archiveNContents = archiveN.contents().not("[nodeType = 1]");
        
        var title = "";

        //Get the (possible) title
        for (var ctr = 0; ctr < archiveNContents.length; ++ctr) {
            title += archiveNContents[ctr].nodeValue;
        }

        var authorFound = false;
        var authorString = "";
        var authorNode;

        //Get the author name
        var archiveNNext = archiveN.parent();

        //Only names that begin with by or edited by are considered possibilities
        var archiveNNextContents = archiveNNext.contents().not("[nodeType = 1]");

        for (var ctr = 0; ctr < archiveNNextContents.length; ++ctr) {
            if (null == archiveNNextContents[ctr].nodeValue.match(/^\s*(edited\s*)?by/i))
                continue;
            else {
                authorNode = archiveNNextContents[ctr];
                authorString += archiveNNextContents[ctr].nodeValue;
                authorFound = true;
                break;
            }
        }

        if (false == authorFound) //we didn't find a title
            return;

        //Create the link based on the title
        link = libxEnv.makeLink(doc, 
                                libxEnv.getProperty("catsearch.label", 
                                                    [libraryCatalog.name, title]), 
                                libraryCatalog.makeTitleSearch(title), 
                                libraryCatalog); 


        //A little space between the cue and the author string
        var spacer = archiveNNext[0].insertBefore(doc.createTextNode(" "), authorNode);

        archiveNNext[0].insertBefore(link, spacer);
	$(link).show()

        //Fade in effect
        $(link).fadeOut("slow");
        $(link).fadeIn("slow");
    }

    else if (0 < n.length) {
        //We found a current version of the page
        // An example with a single title and author where the title line
        // is nested in an additional element compared to the next example
        // see <http://www.nytimes.com/2008/03/02/books/review/Brinkley-t.html>
        
        // An example with two titles and authors
        // and <http://www.nytimes.com/2006/04/27/books/27masl.html>
        var nContents = n.contents();

        //Check the node type of nContents.  If it's 1, then we need to get the
        //contents of that node in order to get the title string.
        //TODO: Needs further testing (pages like this that have more than
        //one title line for instance)
        if (0 < nContents.length && 1 == nContents[0].nodeType)
            nContents = nContents.contents();

        var nNext = n.next();

        //Get "By ..." strings
        var nNextContents = nNext.contents();

        for (var i = 0; i < n.length; i++) {
            // Check to see whether nNextContents[i] begins with "by" or "edited by"
            if (null == nNextContents[i] || null == nNextContents[i].nodeValue.match(/^\s*(edited\s*)?by/i))
                continue;

            if (null != nNextContents[i]) {
                var title = nContents[i].nodeValue.toString();
                var title = title.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
                var link = libxEnv.makeLink(doc, 
                                            libxEnv.getProperty("catsearch.label", [libraryCatalog.name, title]), 
                                            libraryCatalog.makeTitleSearch(title), libraryCatalog);


                //For some reason, nNextContents[i] doesn't work as a node in 
                //insert before, but using null instead works ...
                n[i].insertBefore(link, null);

                $(link).show();
		$(link).fadeOut("slow");
                $(link).fadeIn("slow");
            }
        }

    }
    else
        return;
}
