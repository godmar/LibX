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

// helper function that creates the cue logo to be inserted
// make the equivalent of this html:
// <a title="[title]" href="[url]"><img src="chrome://libx/skin/virginiatech.ico" border="0"/></a>
function makeLink(doc, title, url) {
    var link = doc.createElement('a');
    link.setAttribute('title', title);
    link.setAttribute('href', url);
    var image = doc.createElement('img');
    image.setAttribute('src', libxGetProperty("cue.iconurl"));
    image.setAttribute('border', '0');
    link.appendChild(image);
    return link;
}

// --------------------------------------------------------------------------------------------------
// we wrap all constructor calls for the "DoForURL" objects in this function
// the reason is that we must delay these calls until all of the extensions's XUL is loaded
//
function initializeDoForURLs() {

// Link Amazon pages to the catalog via ISBN
// Idea from Jon Udell's Amazon GreaseMonkey script 

// match amazon page and capture ISBN in match
var amazonAction = new DoForURL(/\.amazon\.com.*\/(\d{7,9}[\d|X])\//, doAmazon);
    
function doAmazon(doc, match) {
    var isbn = match[1];    // grab captured isbn in matched URL
    
    // find first <b> tag with class="sans" - that's where Amazon puts the book title
    var origTitle = xpathFindSingle(doc, "//b[@class='sans']");
    if (!origTitle) {
        return;
    }
    // make link and insert after title
    var div = origTitle.parentNode;
    var link = makeLink(doc, libxGetProperty("isbnsearch.label", [isbn]), libraryCatalog.makeISBNSearch(isbn));
    div.insertBefore(link, origTitle.nextSibling);
}

// --------------------------------------------------------------------------------------------------
// Link Barnes & Noble pages to catalog via ISBN
new DoForURL(/\.barnesandnoble\.com.*&(?:ean|isbn)=(\d{7,12}[\d|X])/, function (doc, match) {
    var isbn = isISBN(match[1]);    // grab captured isbn in matched URL
    
    var origTitle = xpathFindSingle(doc, "//tr[td[@class='itemTitleProduct']]");
    if (!origTitle) {
        return;
    }
    // make link and insert after title
    var link = makeLink(doc, libxGetProperty("isbnsearch.label", [isbn]), libraryCatalog.makeISBNSearch(isbn));
    origTitle.appendChild(link);
});

// --------------------------------------------------------------------------------------------------
// On agricola record pages, add link next to call number

new DoForURL(/agricola\.nal\.usda\.gov/, doAgricola);

function doAgricola(doc) {
    // find a <TR> that has a <TH> child whose textContent is equal to 'Call Number:'
    var cn_tr = xpathFindSingle(doc, "//tr[th[text()='Call Number:']]");
    // starting relative to this <TR>, find the first <TD> child with an <A> grandchild and select the <A> - that's the hyperlinked call number
    var cn_a = xpathFindSingle(doc, "./td/a", cn_tr);
    var cn = cn_a.textContent;// call number
    var link = makeLink(doc, libxGetProperty("callnolookup.label", [cn]), libraryCatalog.makeCallnoSearch(cn));
    // insert cue after <A> element within the containing <TD> element
    cn_a.parentNode.insertBefore(link, cn_a.nextSibling);
}

// --------------------------------------------------------------------------------------------------
// On catalog result pages, add cue that points at floor where book is located

if (libraryCatalog.libxvt)   // only for VT edition
new DoForURL(libraryCatalog.libraryCatalogURLRegExp, function (doc) {
    // find all <tr> where the first <td> child says "Newman Library"
    // and the third <td> child says "AVAILABLE"
    var availrows = xpathFindNodes(doc, '//tr[     td[3] / text()[contains(.,"AVAILABLE")] '
                                      + '      and td[1] / text()[contains(.,"Newman Library")]]');
    for (var i = 0; i < availrows.length; i++) {
        // find the second <TD> child, relative to ith <TR>
        var callno = xpathFindSingle(doc, "td[2]", availrows[i]).textContent;
        callno = callno.replace(/^\s*/, "");
        var floorno = 0;

        if (callno.match(/^[A-Ea-e]/)) {//if call number begins with A-E, then link to 2nd floor map
            floorno = 2;
        }
        if (callno.match(/^[F-Pf-p]/)) {//if call number begins with F-P, then link to 3rd floor map
            floorno = 3;
        }
        if (callno.match(/^[Q-Sq-s]/)) {//if call number begins with Q-S, then link to 4th floor map
            floorno = 4;
        }
        if (callno.match(/^[T-Zt-z]/)) {//if call number begins with T-Z, then link to 5th floor map
            floorno = 5;
        }
        var hasISSN = xpathFindSingle(doc, "//td[@class='bibInfoLabel' and contains(text(),'ISSN')]");
        if (doc.body.textContent.match(/Periodicals/i) || hasISSN) {
            floorno = 4;
        }
        
        var vtlogo = makeLink(doc, "Book is on floor " + floorno + ", click for map", "http://www.lib.vt.edu/help/direct/tour/floor" + floorno + "/map" + floorno + ".html");
                    
        if (floorno == 0) {
            vtlogo = makeLink(doc, "Unable to determine book location!", "http://www.lib.vt.edu/help/direct/tour/");
        }
        
        var lasttd = xpathFindSingle(doc, "td[3]", availrows[i]);
        lasttd.appendChild(doc.createTextNode(" "));
        lasttd.appendChild(vtlogo);
    }
});

// --------------------------------------------------------------------------------------------------
// book review pages on the NY Times website
// link book title to catalog via title
var nytimesAction = new DoForURL(/nytimes\.com.*books/, doNyTimes);

function doNyTimes(doc) {
    var n = new Array();
    var n0 = xpathFindNodes(doc, "//div[@id='sectionPromo']//strong");
    if (n0) {
        n = n.concat(n0);
    }
    var n1 = xpathFindNodes(doc, "//nyt_pf_inline/strong");
    if (n1) {
        n = n.concat(n1);
    }
    
    for (var i = 0; i < n.length; i++) {
        // we only assume it's a book title if its following text() sibling starts with "by" or "edited by"
        for (var s = n[i].nextSibling; s != null && (s.nodeName != '#text' || s.textContent.match(/^\s+$/)); s = s.nextSibling)   // find next #text sibling
            continue;   
        if (s != null && s.textContent.match(/^\s*(edited\s*)?by/i)) {
            var title = n[i].firstChild.textContent.replace(/\s+/g, " ");
            n[i].appendChild(makeLink(doc, libxGetProperty("catsearch.label", [title]), libraryCatalog.makeTitleSearch(title)));
        }       
    }
}

// --------------------------------------------------------------------------------------------------
// Yahoo results pages
// link to catalog via keyword

new DoForURL(/search\.yahoo\.com\/search.*p=/, function (doc) {
    var n = xpathFindSingle(doc, "//h1[text()='Search Results']");
    var searchterms = _content.document.getElementById("yschsp").value;
    n.appendChild(doc.createTextNode(" "));
    n.appendChild(makeLink(doc, libxGetProperty("catsearch.label", [searchterms]), libraryCatalog.makeKeywordSearch(searchterms)));
});

// --------------------------------------------------------------------------------------------------
// Google results pages
// link to catalog via keyword

new DoForURL(/google\.com\/search.*q=/, function (doc) {
    var n = xpathFindSingle(doc, "//tr/td[font[@size='+1' and b[text()='Web']]]");
    var searchterms = doc.gs.q.value;   // google stores its search terms there for its own use
    n.appendChild(makeLink(doc, libxGetProperty("catsearch.label", [searchterms]), libraryCatalog.makeKeywordSearch(searchterms)));
});

// link to catalog from google print via ISBN
new DoForURL(/print.\google\.com\/print/, function (doc) {
    var n = xpathFindSingle(doc, "//tr/td//text()[contains(.,'ISBN')]");
    var m = n.textContent.match(/(\d{9}[X\d])/i);
    var newlink = makeLink(doc, libxGetProperty("isbnsearch.label", [m[1]]), libraryCatalog.makeISBNSearch(m[1]));
    n.parentNode.insertBefore(newlink, n.nextSibling);
});

// rewrite OpenURLs on Google Scholar's page to show cue
if (openUrlResolver && libxGetProperty("libx.rewritescholarpage") == "true") {
 new DoForURL(/scholar\.google\.com\/scholar/, function (doc) {
    var atags = xpathFindSnapshot(doc, "//a[@href]");
    for (var i = 0; i < atags.length; i++) {
        var link = atags[i];
        var p = decodeURIComponent(link.href);
        var m = p.match(/scholar\.google\.com\/url\?sa=U&q=.*\?sid=google(.*)$/);
        if (m) {
            var newlink = makeLink(doc, libxGetProperty("openurllookup.label"), openUrlResolver.completeOpenURL(m[1]));
            link.parentNode.insertBefore(newlink, link.nextSibling);
            link.parentNode.removeChild(link);
        }
    }
 });
}

if (openUrlResolver && libxGetProperty("libx.supportcoins") == "true") {
 new DoForURL(/.+/, function (doc) {
    var coins = xpathFindNodes(doc, "//span[@class='Z3988']");
    for (var i = 0; i < coins.length; i++) {
        try { // the span attribute may be malformed, if so, recover and continue with next
            var span = coins[i];
            var query = decodeURIComponent(span.getAttribute('title'));
            var rft_book = "rft_val_fmt=info:ofi/fmt:kev:mtx:book";
            var rft_journal = "rft_val_fmt=info:ofi/fmt:kev:mtx:journal";

            if (query.indexOf(rft_book) == -1 && query.indexOf(rft_journal) == -1) 
                continue;

            // following code taken with permission from Openlys COINS plugin
            // http://www.openly.com/openurlref/

            // since we only support OpenURL 0.1 at this time, we always unconditionally convert

            //remove "rft." from beginning of attribute keys
            query = query.replace(/rft\./g,"");

            if (query.indexOf("genre=") == -1) {
                if (query.indexOf(rft_journal) > -1) {
                    query += "&genre=article";
                } else {
                    query += "&genre=book";
                }
            }      

            //change some attribute names
            query = query.replace(/jtitle=/,"title=");
            query = query.replace(/btitle=/,"title=");
            query = query.replace(/rft_id=info:pmid\//,"id=pmid:");
            query = query.replace(/rft_id=info:doi\//,"id=doi:");
            query = query.replace(/rft_id=info:bibcode\//,"id=bibcode:");
            // end of code
            query = '&' + query;

            span.appendChild(makeLink(doc, libxGetProperty("openurllookup.label"), openUrlResolver.completeOpenURL(query)));
        } catch (e) {
            dfu_log ("Exception during coins processing: " +e);
        }
    }
 });
}

//
// Serials Solutions currently (as of 10/20/05) does not implement OpenURLs with genre=book
// and an isbn (despite the fact that doing so is dead simple)
// We help the user by including a direct link to an ISBN-based search.
//
if (openUrlResolver && libxGetProperty("libx.sersolisbnfix") == "true") {
    new DoForURL(/serialssolutions\.com\/(.*genre=book.*)/, function (doc, match) {
        var im = match[1].match(/isbn=([0-9xX]{10}|[0-9xX]{13})/i);
        var isbn;
        if (im && (isbn = isISBN(im[1]))) {
            var h4 = xpathFindSingle(doc, "//h4[contains(text(), 'No direct links were found')]");
            if (!h4) {
                return;
            }
            var hint = makeLink(doc, libxGetProperty("isbnsearch.label", [isbn]), libraryCatalog.makeISBNSearch(isbn));
            var it = doc.createElement("i");
            it.appendChild(doc.createTextNode(" LibX Enhancement: " +  libxGetProperty("isbnsearch.label", [isbn])));

            var par = doc.createElement("p");
            par.appendChild(hint);
            par.appendChild(it);
            h4.parentNode.insertBefore(par, h4);
        }
    });

    // fix it up if SerSol thinks it does not have enough information even though a DOI is in the OpenURL
    new DoForURL(/serialssolutions\.com\/.*id=doi:([^&]+)(&|$)/, function (doc, match) {
        var doi = match[1];
        var h3 = xpathFindSingle(doc, "//h3[contains(text(), 'We do not have enough information')]");
        if (!h3) {
            return;
        }
        var hint =  makeLink(doc, "Try dx.doi.org/" + doi,  "http://dx.doi.org/" + doi);
        var it = doc.createElement("i");
        it.appendChild(doc.createTextNode(" LibX Enhancement: Try CrossRef for DOI " + doi));
        var par = doc.createElement("p");
        par.appendChild(hint);
        par.appendChild(it);
        h3.parentNode.insertBefore(par, h3);
    });
}

} //end of initializeDoForUrls

// vim: ts=4
