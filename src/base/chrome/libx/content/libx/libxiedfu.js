/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is LibX Firefox Extension.
 *
 * The Initial Developer of the Original Code is Annette Bailey (libx.org@gmail.com)
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer and Virginia Tech. All Rights Reserved.
 *
 * Contributor(s): Godmar Back (godmar@gmail.com)
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * A few examples of where the library toolbar can help a user get access to library resources
 * Authors: Annette Bailey <annette.bailey@gmail.com>
 *          Godmar Back <godmar@gmail.com>
 *
 */ 

// --------------------------------------------------------------------------------------------------
// we wrap all constructor calls for the "DoForURL" objects in this function
// the reason is that we must delay these calls until all of the extensions's XUL is loaded
//
/**
 * Function that intializes various DoForURL functions
 */
function libxInitializeIEDFU() {

// Link Amazon pages to the catalog via ISBN
// Idea from Jon Udell's Amazon GreaseMonkey script 

var amazonAction = new DoForURL(/amazon\.com\//, doAmazon);
var amazonUkAction = new DoForURL(/amazon\.co\.uk\//, doAmazon);
var amazonCaAction = new DoForURL(/amazon\.ca\//, doAmazon);
var amazonDeAction = new DoForURL(/amazon\.de\//, doAmazon);
var amazonFrAction = new DoForURL(/amazon\.fr\//, doAmazon);
    
// revised Apr 4, 2007
function doAmazon(doc, match) {
    var isbnNodeArray = libxEnv.$("b:contains('ISBN')");

    if (0 == isbnNodeArray.length)
        return;

    var isbnVal = isbnNodeArray[0].nextSibling.nodeValue;

    var isbn = isISBN(isbnVal);

    var booktitleNodeArray = libxEnv.$("div.buying > b.sans, div.buying > b.asinTitle");

    if (0 == booktitleNodeArray.length)
        return;

    var booktitleNode = booktitleNodeArray[0];

    // make link and insert after title
    var div = booktitleNode.parentNode;
    var cue = libxEnv.makeLink(doc, 
                        libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]), 
                        libraryCatalog.linkByISBN(isbn), libraryCatalog);
    libxEnv.$(cue).hide();

    div.insertBefore(cue, booktitleNode.nextSibling);
    libxEnv.$(cue).fadeIn(10000);
}

// alibris.com
new DoForURL(/\.alibris\.com\//, function (doc, match) {
    var isbnLinks = libxEnv.$("a[href*='isbn']");

    for (var i = 0; i < isbnLinks.length; i++) {
        var isbnLink = isbnLinks[i];
        var href = isbnLink.getAttribute('href');
        var isbn, isbnMatch = href.match(/isbn\/((\d|X){10,13})/i);
        if (isbnMatch != null && (isbn = isISBN(isbnMatch[1])) != null) {
            var cue = libxEnv.makeLink(doc, 
                        libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]), 
                        libraryCatalog.linkByISBN(isbn), libraryCatalog);


            //Allows the following fadeIn effect to work
            libxEnv.$(cue).hide();
            toShowJQ = libxEnv.$(isbnLink).next().before(cue);
            libxEnv.$(isbnLink).next().after(doc.createTextNode(" "));

            //fade in over 10 seconds.
            libxEnv.$(cue).fadeIn(10000);
        }
    }
});

// --------------------------------------------------------------------------------------------------
// Link Barnes & Noble pages to catalog via ISBN
var bnFunction = function (doc, match) {
    var isbn = isISBN(match[1]);    // grab captured isbn in matched URL
    if (isbn == null)
        return;
    
    // last verified Mar 02, 2008
    var origTitleNodeArray = libxEnv.$("div#product-info").find("h2");

    if (0 == origTitleNodeArray.length)
        return;

    var origTitleNode = origTitleNodeArray[0];
    
    // make link and insert after title
    var link = libxEnv.makeLink(doc, libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]), libraryCatalog.linkByISBN(isbn), libraryCatalog);

    libxEnv.$(link).hide();
    libxEnv.$(origTitleNode).contents().eq(0).before(doc.createTextNode(" "));
    libxEnv.$(origTitleNode).contents().eq(0).before(link);
    libxEnv.$(link).fadeIn(10000);
}

// as in http://search.barnesandnoble.com/booksearch/isbnInquiry.asp?z=y&isbn=9780060788704&itm=1
new DoForURL(/\.barnesandnoble\.com.*(?:EAN|isbn)=(\d{7,12}[\d|X])/i, bnFunction);
// as in http://search.barnesandnoble.com/The-Outlaw-Demon-Wails/Kim-Harrison/e/9780060788704/?itm=1
new DoForURL(/\.barnesandnoble\.com.*\/(\d{10,12}[\d|X])\//i, bnFunction);

// -----------------------------------------------------------------------------
// Link ecampus.com pages to catalog via ISBN
new DoForURL(/(\/\/|\.)ecampus\.com.*(\d{9}[\d|X])/i, function (doc, match) {
    var origISBNNodeArray = libxEnv.$("a.nolink");
    var origISBNNode = origISBNNodeArray[0];
    var origISBNTextNode = origISBNNodeArray.contents();
    var isbn = origISBNTextNode[0].nodeValue;

    if (0 == origISBNNodeArray.length)
        return;

    if (!isbn)
        return;
    var link = libxEnv.makeLink(doc, libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]), libraryCatalog.linkByISBN(isbn), libraryCatalog);
    libxEnv.$(link).hide();
    origISBNNode.appendChild(link);
    libxEnv.$(link).fadeIn(10000);
});

// --------------------------------------------------------------------------------------------------
// On agricola record pages, add link next to call number

new DoForURL(/agricola\.nal\.usda\.gov/, doAgricola);

function doAgricola(doc) {
    // find a <TR> that has a <TH> child whose textContent is equal to 'Call Number:'
    var cn_tr = libxEnv.$("tr th").filter(":contains('Call Number:')");

    if (0 == cn_tr.length)
        return;
    // starting relative to this <TR>, find the first <TD> child with an <A> grandchild and select the <A> - that's the hyperlinked call number
    var cn_aNode = cn_tr.next("td").children("a");

    if (0 == cn_aNode.length)
        return;

    var cn_a = cn_aNode.contents()[0];
    var cn = cn_a.nodeValue;

    var link = libxEnv.makeLink(doc, libxEnv.getProperty("callnolookup.label", [libraryCatalog.name, cn]), libraryCatalog.makeCallnoSearch(cn), libraryCatalog);
    libxEnv.$(link).hide();
    // insert cue after <A> element within the containing <TD> element
    cn_a.parentNode.insertBefore(link, cn_a.nextSibling);
    libxEnv.$(link).fadeIn(10000);
}

// --------------------------------------------------------------------------------------------------
// book review pages on the NY Times website
// link book title to catalog via title
var nytimesAction = new DoForURL(/nytimes\.com.*books/, doNyTimes);

function doNyTimes(doc) {
    var n = new Array();
    
    //Try a couple of queries
    var archiveN = libxEnv.$("div[id='sectionPromo'] strong");
    var n = libxEnv.$("div.sectionPromo h4, div[id='sectionPromo'] h4");

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

        libxEnv.$(link).hide();

        //A little space between the cue and the author string
        var spacer = archiveNNext[0].insertBefore(doc.createTextNode(" "), authorNode);

        archiveNNext[0].insertBefore(link, spacer);

        //Fade in effect
        libxEnv.$(link).fadeIn(10000);
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

                libxEnv.$(link).hide();

                //For some reason, nNextContents[i] doesn't work as a node in 
                //insert before, but using null instead works ...
                n[i].insertBefore(link, null);

                libxEnv.$(link).fadeIn(10000);
            }
        }

    }
    else
        return;
}

// --------------------------------------------------------------------------------------------------
// Yahoo results pages
// link to catalog via keyword

new DoForURL(/search\.yahoo\.com\/search.*p=/, function (doc) {
    // last updated 10/16/2007
    var alsotryArray = libxEnv.$("ul[id='atatl']");

    if (0 == alsotryArray.length)
        return;

    var alsotry = alsotryArray[0];

    var searchtermsArray = libxEnv.$("input[id='yschsp']");

    if (0 == searchtermsArray.length)
        return;

    var searchterms = searchtermsArray[0];
    var link = libxEnv.makeLink(doc, libxEnv.getProperty("catsearch.label", [libraryCatalog.name, searchterms]), libraryCatalog.makeKeywordSearch(searchterms), libraryCatalog);
    libxEnv.$(link).hide();

    if (alsotry && searchterms) {
        alsotry.appendChild(link);
        libxEnv.$(link).fadeIn(10000);
    }
});

// --------------------------------------------------------------------------------------------------
// Google results pages
// link to catalog via keyword

new DoForURL(/google\.[a-z]+\/search.*q=/i, function (doc) {
    var nArray = libxEnv.$("tr td span[id='sd']");

    if (0 == nArray.length)
        return;

    n = nArray[0];

    var searchterms = doc.gs.q.value;   // google stores its search terms there for its own use

    var link = libxEnv.makeLink(doc, libxEnv.getProperty("catsearch.label", [libraryCatalog.name, searchterms]), libraryCatalog.makeKeywordSearch(searchterms), libraryCatalog)

    libxEnv.$(link).hide();

    n.parentNode.appendChild(link);

    libxEnv.$(link).fadeIn(10000);
});

// link to catalog from google print via ISBN
new DoForURL(/books.\google\.com\/books\?id/, function (doc) {
    var n = libxEnv.xpath.findSingle(doc, "//tr/td//text()[contains(.,'ISBN')]");
    var nArray = libxEnv.$("tr > td").filter(":contains('ISBN')");

    if (0 == nArray.length)
        return;

    var n = nArray[1];
    var nText = libxEnv.$(n).text();
    var m = nText.match(/(\d{9}[X\d])/i);
    var newlink = libxEnv.makeLink(doc, libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, m[1]]), libraryCatalog.linkByISBN(m[1]), libraryCatalog);
    libxEnv.$(newlink).hide();
    var ns = n.nextSibling;
    cue = n.insertBefore(newlink, ns);
    // a white space to make it pretty for Melissa
    n.insertBefore(doc.createTextNode(" "), cue);
    libxEnv.$(newlink).fadeIn(10000);
});

new DoForURL(/books.\google\.com\/books\?q/, function (doc) {
    // look for links like this: http://books.google.com/books?q=editions:ISBN0786257784&id=dyF7AAAACAAJ
    var n = libxEnv.xpath.findNodes(doc, "//a[contains(@href,'editions:ISBN')]");
    nArray = libxEnv.$("a[href*='editions:ISBN']");

    for (var i = 0; i < n.length; i++) {
        var ilink = n[i].getAttribute('href');
        var m = ilink.match(/editions:ISBN(\d{10,13})&/);
        if (m) {
            var newlink = libxEnv.makeLink(doc, libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, m[1]], libraryCatalog),
                    libraryCatalog.linkByISBN(m[1]));
            libxEnv.$(newlink).hide();
            var ns = n[i].nextSibling;
            n[i].parentNode.insertBefore(newlink, ns);
            n[i].parentNode.insertBefore(doc.createTextNode(" "), ns);
            libxEnv.$(newlink).fadeIn(10000);
        }
    }
});

// rewrite OpenURLs on Google Scholar's page to show cue
if (libxEnv.openUrlResolver && libxEnv.options.rewritescholarpage) {
 function rewriteScholarPage(doc, proxy) {
    var atags = libxEnv.$("a[href]");
    
    for (var i = 0; i < atags.length; i++) {
        var link = atags[i];
        var p = decodeURIComponent(link.href);
        var m = p.match(/.*\?sid=google(.*)$/);

        // should match scholar viewed through WAM-proxy as well

        // do not rewrite Refworks link
        if (m && (m[0].match(/\.refworks\.com/) == null)) {
            var ourl = libxEnv.openUrlResolver.completeOpenURL(m[1], "0.1");
            var newlink = libxEnv.makeLink(doc, libxEnv.getProperty("openurllookup.label", [libxEnv.openUrlResolver.name]), ourl, libxEnv.openUrlResolver);
            libxEnv.$(newlink).hide();
            link.parentNode.insertBefore(newlink, link.nextSibling);
            link.parentNode.insertBefore(doc.createTextNode(" "), link.nextSibling); 
            libxEnv.$(newlink).fadeIn(10000);
            // link.parentNode.removeChild(link);
        }
    }
 }
 new DoForURL(/scholar\.google\.com(.*)\/scholar\?/, rewriteScholarPage);
}

if (libxEnv.openUrlResolver && libxEnv.options.supportcoins) {
    new DoForURL(/.+/, 
                 function (doc) {
                     libxEnv.handleCoins(doc, libxEnv.openUrlResolver) 
                 });
}

//
// Serials Solutions currently (as of 10/20/05) does not implement OpenURLs with genre=book
// and an isbn (despite the fact that doing so is dead simple)
// We help the user by including a direct link to an ISBN-based search.
//
if (libxEnv.openUrlResolver && libxEnv.options.sersolisbnfix) {
    new DoForURL(/serialssolutions\.com\/(.*genre=book.*)/, function (doc, match) {
        var im = match[1].match(/isbn=([0-9xX]{10,13})/i);
        var isbn;
        if (im && (isbn = isISBN(im[1]))) {
            var h4 = libxEnv.xpath.findSingle(doc, "//h4[contains(text(), 'No direct links were found')]");
            if (h4 == null) {
                h4 = libxEnv.xpath.findSingle(doc, "//h3[contains(text(), 'We do not have enough information')]");
            }
            if (h4 == null) {
                h4 = libxEnv.xpath.findSingle(doc, "//div[contains(@class, 'SS_NoResults')]");
            }
            if (h4 == null)
                return;
            var hint = libxEnv.makeLink(doc, libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]), libraryCatalog.makeISBNSearch(isbn), libraryCatalog);
            var it = doc.createElement("i");
            it.appendChild(doc.createTextNode(" LibX Enhancement: " +  libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn])));

            var par = doc.createElement("p");
            par.appendChild(hint);
            par.appendChild(it);
            h4.parentNode.insertBefore(par, h4);
        }
    });

// fix it up if SerSol thinks it does not have enough information even though a DOI is in the OpenURL
new DoForURL(/serialssolutions\.com\/.*id=doi:([^&]+)(&|$)/, function (doc, match) {
        var doi = match[1];
        // the first expression is probably obsolete now
        var h3 = libxEnv.xpath.findSingle(doc, "//h3[contains(text(), 'We do not have enough information')]");
        if (!h3) {
            h3 = libxEnv.xpath.findSingle(doc, "//div[contains(@class, 'SS_NoResults')]");
            if (!h3)
                return;
        }
        var hint =  libxEnv.makeLink(doc, "Try dx.doi.org/" + doi,  "http://dx.doi.org/" + doi, libxEnv.openUrlResolver);
        var it = doc.createElement("i");
        it.appendChild(doc.createTextNode(" LibX Enhancement: Try CrossRef for DOI " + doi));
        var par = doc.createElement("p");
        par.appendChild(hint);
        par.appendChild(it);
        h3.parentNode.insertBefore(par, h3);
    });
}

// globalbooksinprint.com
new DoForURL(/\.globalbooksinprint\.com.*Search/, function(doc) {
    var labels = libxEnv.$("tr > td a").contents().filter("[href*='/merge_shared/Details']'");

    for (var i = 0; i < labels.length; i++) {
        var anode = labels[i];
        var isbn13 = libxEnv.$(anode).parents().filter(".oddRowSR,.evenRowSR").next().children().contents().filter(":contains('ISBN 13:')");

        if (0 == isbn13.length)
            continue;

        var isbn13Text = isbn13[0].nextSibling.nodeValue;

        var isbn = isISBN(isbn13Text);

        if (isbn == null)
            continue;
        var hint = libxEnv.makeLink(doc, 
                    libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]), 
                    libraryCatalog.linkByISBN(isbn), libraryCatalog);
        libxEnv.$(hint).hide();
        anode.parentNode.insertBefore(hint, anode.nextSibling);
        libxEnv.$(hint).fadeIn(10000);
    }
});

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
    var titleLabel = libxEnv.$("div[id='stock_info']");

    // Step past the stock_info node, and the following text node, and you
    // will be at the title node.

    titleLabel = titleLabel[0].nextSibling;
    libxEnv.writeLog("titleLabel " + titleLabel);

	if (titleLabel) {
        var link = libxEnv.makeLink(doc, 
                libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]), 
                libraryCatalog.linkByISBN(isbn), libraryCatalog);
        // <strong>ISBN:</strong><a suppressautolink>0743226712</a>_SPACE_<CUE>
		//right of title use this: titleLabel.appendChild(link);
        libxEnv.$(link).hide();
        titleLabel.insertBefore(link, titleLabel.firstChild);
        libxEnv.$(link).fadeIn(10000);
    }
}
new DoForURL(/(\/\/|\.)powells\.com\/biblio\/\d*\-?((\d|x){13})\-?\d*/i, powellsComByISBN);
new DoForURL(/(\/\/|\.)powells\.com\/biblio\/\d*\-?((\d|x){10})\-?\d*/i, powellsComByISBN);
new DoForURL(/(\/\/|\.)powells\.com\/.*isbn=((\d|x){10}|(\d|x){13})/i, powellsComByISBN);
new DoForURL(/(\/\/|\.)powells\.com\/.*:((\d|x){10}|(\d|x){13}):/i, powellsComByISBN);

// chapters.ca or chapters.indigo.ca
// the URL appears to embed both a ISBN-13 and an ISBN - look for "ISBN:" instead
new DoForURL(/chapters\..*\.ca\//, function (doc) {
    var isbnlabel = libxEnv.$("label:contains('ISBN:')");

    if (0 == isbnlabel.length)
        return;

    isbnLabelText = isbnlabel[0].nextSibling.nodeValue;

        var isbn = isISBN(isbnLabelText);
        if (isbn) {
            var link = libxEnv.makeLink(doc,
                    libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]),
                    libraryCatalog.linkByISBN(isbn), libraryCatalog);
            libxEnv.$(link).hide();
            // place this link prominently by the booktitle
            var t = libxEnv.$("div[id=itemProductHeading] > h1");

            if (0 == t.length)
                return;

            t[0].insertBefore(link, t[0].firstChild);
            t[0].insertBefore(doc.createTextNode(" "), link);
            libxEnv.$(link).fadeIn(10000);
        } 
    });

// fix up the WAM page that says "The address you are trying to access is invalid."
if (libxProxy != null && libxProxy.type == "wam") {
    // this matches on a WAM DNS'ed URL
    var rexp = new RegExp("\\d+\\-(.*)\\." + libxProxy.url.replace(/\./g, "\\."));
    new DoForURL(rexp, function(doc, m) {
        var err = libxEnv.xpath.findSingle(doc, "//*[contains(text(),'The address you are trying to access is invalid')]");
        if (err) {
            var blink = doc.createElement("a");
            blink.setAttribute('href', "javascript:history.back()");
            var p = doc.createElement("p");
            p.appendChild(doc.createTextNode(
                    "LibX cannot reload " + m[1] + " through WAM. " +
                    "Contact your library administrator for details, " +
                    "who may be able to add this URL to the WAM configuration. " +
                    "Click to return to the previous page"));
            blink.appendChild(p);
            err.appendChild(blink);
            // TODO: add the option to set a mailto: link here.
        }
    });
}

// abebooks.com makes things easy for us by placing ISBN in a hyperlink with class 'isbn'
new DoForURL(/(\/\/|\.)abebooks\.com/, function (doc) {
    var n = libxEnv.$("a.isbn");
    var nContents = libxEnv.$("a.isbn").contents();

    if (0 == n.length)
        return;

    for (var i = 0; i < n.length; i++) {

        var isbn = nContents[i].nodeValue;

        if (isbn) {
            var newlink = libxEnv.makeLink(doc,
                libxEnv.getProperty("isbnsearch.label",
                    [libraryCatalog.name, isbn]),
                libraryCatalog.linkByISBN(isbn), libraryCatalog);
            libxEnv.$(newlink).hide();
            n[i].parentNode.insertBefore(newlink, n[i].nextSibling);
            n[i].parentNode.insertBefore(doc.createTextNode(" "), newlink);
            libxEnv.$(newlink).fadeIn(10000);
        }
    }
});

var autolink = new DoForURL(/.*/, function (doc) {
    // to work around https://bugzilla.mozilla.org/show_bug.cgi?id=315997
    // we skip autolink if the page contains any textarea element.
    // (though the bug purportedly only affects large textarea elements.)
    var n = libxEnv.xpath.findNodes(doc, "//textarea");
    if (n.length > 0)
        return;

    if (libxEnv.options.autolink_active)
        libxRunAutoLink(doc, false); // false -> not right away
});

// exclude OpenURL resolver page if using sersol
if (libxEnv.openUrlResolver && libxEnv.openUrlResolver.type == "sersol") {
    autolink.exclude = [libxEnv.openUrlResolver.url.replace("http://", "")];
}

} //end of initializeDoForUrls

// vim: ts=4
