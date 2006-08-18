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
function makeLink(doc, title, url, openurl) {
    var link = doc.createElement('a');
    link.setAttribute('title', title);
    link.setAttribute('href', url);
    var image = doc.createElement('img');
    if (openurl && openUrlResolver && openUrlResolver.image) {
        image.setAttribute('src', openUrlResolver.image);
    } else {
        image.setAttribute('src', libxGetProperty("cue.iconurl"));
    }
    image.setAttribute('border', '0');
    link.appendChild(image);
    return link;
}

// --------------------------------------------------------------------------------------------------
// we wrap all constructor calls for the "DoForURL" objects in this function
// the reason is that we must delay these calls until all of the extensions's XUL is loaded
//
function libxInitializeDFU() {

// Link Amazon pages to the catalog via ISBN
// Idea from Jon Udell's Amazon GreaseMonkey script 

// match amazon page and capture ISBN in match
var amazonAction = new DoForURL(/\.amazon\.com.*\/(\d{7,9}[\d|X])\/?/, doAmazon);
var amazonUkAction = new DoForURL(/\.amazon\.co\.uk.*\/(\d{7,9}[\d|X])\/?/, doAmazon);
var amazonCaAction = new DoForURL(/\.amazon\.ca.*\/(\d{7,9}[\d|X])\/?/, doAmazon);
    
function doAmazon(doc, match) {
    var isbn = match[1];    // grab captured isbn in matched URL
    
    // find first <b> tag with class="sans" - that's where Amazon puts the book title
    var origTitle = xpathFindSingle(doc, "//b[@class='sans']");
    if (!origTitle) {
        return;
    }
    // make link and insert after title
    var div = origTitle.parentNode;
    var link = makeLink(doc, libxGetProperty("isbnsearch.label", [libraryCatalog.name, isbn]), libraryCatalog.linkByISBN(isbn));
    div.insertBefore(link, origTitle.nextSibling);
}

// --------------------------------------------------------------------------------------------------
// Link Barnes & Noble pages to catalog via ISBN
new DoForURL(/\.barnesandnoble\.com.*(?:ean|isbn)=(\d{7,12}[\d|X])/, function (doc, match) {
    var isbn = isISBN(match[1]);    // grab captured isbn in matched URL
    
    var origTitle = xpathFindSingle(doc, "//h1[@id='title']");
    if (!origTitle) {
        return;
    }
    // make link and insert after title
    var link = makeLink(doc, libxGetProperty("isbnsearch.label", [libraryCatalog.name, isbn]), libraryCatalog.linkByISBN(isbn));
    origTitle.appendChild(link);
});

// -----------------------------------------------------------------------------
// Link ecampus.com pages to catalog via ISBN
new DoForURL(/\.ecampus\.com.*(\d{9}[\d|X])/i, function (doc, match) {
    var origISBN = xpathFindSingle(doc, "//a[@class='nolink']");
    if (!origISBN)
        return;
    var isbn = isISBN(origISBN.textContent);
    if (!isbn)
        return;
    var link = makeLink(doc, libxGetProperty("isbnsearch.label", [libraryCatalog.name, isbn]), libraryCatalog.linkByISBN(isbn));
    origISBN.appendChild(link);
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
    var link = makeLink(doc, libxGetProperty("callnolookup.label", [libraryCatalog.name, cn]), libraryCatalog.makeCallnoSearch(cn));
    // insert cue after <A> element within the containing <TD> element
    cn_a.parentNode.insertBefore(link, cn_a.nextSibling);
}

// --------------------------------------------------------------------------------------------------
// On catalog result pages, add cue that points at floor where book is located

if (libraryCatalog.sid == "libxvt")   // only for VT edition
new DoForURL(libraryCatalog.urlregexp, function (doc) {
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
    var n0 = xpathFindNodes(doc, "//div[@id='sectionPromo']//h4");  // new design
    if (n0) {
        n = n.concat(n0);
    }
    // there appear to be archived pages that still use this as of apr/06
    var n1 = xpathFindNodes(doc, "//nyt_pf_inline/strong");
    if (n1) {
        n = n.concat(n1);
    }
    
    for (var i = 0; i < n.length; i++) {
        // we only assume it's a book title if its following text() sibling 
        // starts with "by" or "edited by" 
        // find next #text sibling
        for (var s = n[i].nextSibling; s != null && (s.textContent.match(/^\s*(edited\s*)?by/i) == null); s = s.nextSibling)   
            continue;   

        if (s != null) {
            var title = n[i].firstChild.textContent.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
            n[i].parentNode.insertBefore(
                makeLink(doc, 
                         libxGetProperty("catsearch.label", [libraryCatalog.name, title]), 
                         libraryCatalog.makeTitleSearch(title)), 
                s);
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
    n.appendChild(makeLink(doc, libxGetProperty("catsearch.label", [libraryCatalog.name, searchterms]), libraryCatalog.makeKeywordSearch(searchterms)));
});

// --------------------------------------------------------------------------------------------------
// Google results pages
// link to catalog via keyword

new DoForURL(/google\.[a-z]+\/search.*q=/i, function (doc) {
    var n = xpathFindSingle(doc, "//tr/td[font[@size='+1' and b[text()='Web']]]");
    var searchterms = doc.gs.q.value;   // google stores its search terms there for its own use
    n.appendChild(makeLink(doc, libxGetProperty("catsearch.label", [libraryCatalog.name, searchterms]), libraryCatalog.makeKeywordSearch(searchterms)));
});

// link to catalog from google print via ISBN
new DoForURL(/books.\google\.com\/books/, function (doc) {
    var n = xpathFindSingle(doc, "//tr/td//text()[contains(.,'ISBN')]");
    var m = n.textContent.match(/(\d{9}[X\d])/i);
    var newlink = makeLink(doc, libxGetProperty("isbnsearch.label", [libraryCatalog.name, m[1]]), libraryCatalog.linkByISBN(m[1]));
    var ns = n.nextSibling;
    n.parentNode.insertBefore(newlink, ns);
    // a white space to make it pretty for Melissa
    n.parentNode.insertBefore(doc.createTextNode(" "), ns); 
});

// rewrite OpenURLs on Google Scholar's page to show cue
if (openUrlResolver && libxConfig.options.rewritescholarpage) {
 function rewriteScholarPage(doc, proxy) {
    var atags = xpathFindSnapshot(doc, "//a[@href]");
    for (var i = 0; i < atags.length; i++) {
        var link = atags[i];
        var p = decodeURIComponent(link.href);
        var m = p.match(/scholar\.google\.com\/url\?sa=U&q=.*\?sid=google(.*)$/);

        if (!m)         // highjack WAM-proxied form as well
            m = p.match(/\-scholar\.google\.com.*\/url\?sa=U&q=.*\?sid=google(.*)$/);

        // do not rewrite Refworks link
        if (m && (m[0].match(/\.refworks\.com/) == null)) {
            var ourl = openUrlResolver.completeOpenURL(m[1]);
            var newlink = makeLink(doc, libxGetProperty("openurllookup.label", [openUrlResolver.name]), ourl, true);
            link.parentNode.insertBefore(newlink, link.nextSibling);
            link.parentNode.removeChild(link);
        }
    }
 }
 new DoForURL(/scholar\.google\.com(.*)\/scholar\?/, rewriteScholarPage);
}

if (openUrlResolver && libxConfig.options.supportcoins) {
 new DoForURL(/.+/, function (doc) {
    var coins = xpathFindNodes(doc, "//span[@class='Z3988']");
    for (var i = 0; i < coins.length; i++) {
        try { // the span attribute may be malformed, if so, recover and continue with next
            var span = coins[i];
            var query = span.getAttribute('title');
            query = query.replace(/&amp;/g, "&").replace(/\+/g, "%20").split(/&/);

            var rft_book = "rft_val_fmt=info:ofi/fmt:kev:mtx:book";
            var rft_journal = "rft_val_fmt=info:ofi/fmt:kev:mtx:journal";
            var isBookOrArticle = false;

            for (var j = 0; j < query.length; j++) {
                var qj = decodeURIComponent(query[j]);

                // some 0.1 resolver (SerSol) don't like the 'url_ver=' option
                if (openUrlResolver.version != "1.0" && qj.match(/^url_ver=/)) {
                    query[j] = "";
                    continue;
                }

                if (qj == rft_book) {
                    isBookOrArticle = true;
                    if (openUrlResolver.version != "1.0")
                        query[j] = "genre=book";
                    continue;
                }
                if (qj == rft_journal) {
                    isBookOrArticle = true;
                    if (openUrlResolver.version != "1.0")
                        query[j] = "genre=article";
                    continue;
                }

                if (openUrlResolver.version != "1.0") {
                    //convert to 0.1 unless 1.0 is given
                    //remove "rft." from beginning of attribute keys
                    qj = qj.replace(/rft\./g,"");

                    //change some attribute names
                    qj = qj.replace(/jtitle=/,"title=");
                    qj = qj.replace(/btitle=/,"title=");
                    qj = qj.replace(/rft_id=info:pmid\//,"id=pmid:");
                    qj = qj.replace(/rft_id=info:doi\//,"id=doi:");
                    qj = qj.replace(/rft_id=info:bibcode\//,"id=bibcode:");
                }

                var kv = qj.split(/=/);
                var val = kv.splice(1).join("=");
                query[j] = kv[0] + '=' + encodeURIComponent(val);
            }
            query = "&" + query.join("&");

            if (isBookOrArticle) {
                span.appendChild(makeLink(doc, libxGetProperty("openurllookup.label", [openUrlResolver.name]), openUrlResolver.completeOpenURL(query), true));
            }
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
if (openUrlResolver && libxConfig.options.sersolisbnfix) {
    new DoForURL(/serialssolutions\.com\/(.*genre=book.*)/, function (doc, match) {
        var im = match[1].match(/isbn=([0-9xX]{10}|[0-9xX]{13})/i);
        var isbn;
        if (im && (isbn = isISBN(im[1]))) {
            var h4 = xpathFindSingle(doc, "//h4[contains(text(), 'No direct links were found')]");
            if (h4 == null)
                h4 = xpathFindSingle(doc, "//h3[contains(text(), 'We do not have enough information')]");
            if (h4 == null)
                h4 = xpathFindSingle(doc, "//div[contains(@class, 'SS_NoResults')]");
            if (h4 == null)
                return;
            var hint = makeLink(doc, libxGetProperty("isbnsearch.label", [libraryCatalog.name, isbn]), libraryCatalog.makeISBNSearch(isbn));
            var it = doc.createElement("i");
            it.appendChild(doc.createTextNode(" LibX Enhancement: " +  libxGetProperty("isbnsearch.label", [libraryCatalog.name, isbn])));

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
        var h3 = xpathFindSingle(doc, "//h3[contains(text(), 'We do not have enough information')]");
        if (!h3) {
            h3 = xpathFindSingle(doc, "//div[contains(@class, 'SS_NoResults')]");
            if (!h3)
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

// globalbooksinprint.com
new DoForURL(/\.globalbooksinprint\.com.*Search/, function(doc) {
    var labels = xpathFindNodes(doc, "//tr/td//a[contains(@href, '/merge_shared/Details')]");
    for (var i = 0; i < labels.length; i++) {
        var anode = labels[i];
        var isbn13 = xpathFindSingle(doc, "../../../..//b[contains(text(),'ISBN 13:')]", anode);
        if (isbn13 == null)
            continue;
        var isbn = isISBN(isbn13.nextSibling.textContent);
        if (isbn == null)
            continue;
        var hint = makeLink(doc, 
                    libxGetProperty("isbnsearch.label", [libraryCatalog.name, isbn]), 
                    libraryCatalog.linkByISBN(isbn));
        anode.parentNode.insertBefore(hint, anode.nextSibling);
    }
});

// powells.com
// http://www.powells.com/biblio/1-0743226712-2
function powellsComByISBN(doc, m) 
{
    var isbn = isISBN(m[1]);
    if (isbn == null)
        return;
    var isbnlabel = xpathFindSingle(doc, "//strong[contains(text(),'ISBN:')]");
    if (isbnlabel) {
        var link = makeLink(doc, 
                libxGetProperty("isbnsearch.label", [libraryCatalog.name, isbn]), 
                libraryCatalog.linkByISBN(isbn));
        // <strong>ISBN:</strong><a suppressautolink>0743226712</a>_SPACE_<CUE>
        isbnlabel.parentNode.insertBefore(link, isbnlabel.nextSibling.nextSibling.nextSibling.nextSibling);
    }
}
new DoForURL(/\.powells\.com\/biblio\/\d*\-((\d|x){10})\-\d*/i, powellsComByISBN);
new DoForURL(/\.powells\.com\/.*isbn=((\d|x){10})/i, powellsComByISBN);
new DoForURL(/\.powells\.com\/.*:((\d|x){10}):/i, powellsComByISBN);

// chapters.ca or chapters.indigo.ca
// the URL appears to embed both a ISBN-13 and an ISBN - look for "ISBN:" instead
new DoForURL(/chapters\..*\.ca\//, function (doc) {
    var isbnlabel = xpathFindSingle(doc, "//div/text()[contains(.,'ISBN:')]");
    if (isbnlabel) {
        var isbn = isISBN(isbnlabel.nextSibling.textContent);
        if (isbn) {
            var link = makeLink(doc,
                    libxGetProperty("isbnsearch.label", [libraryCatalog.name, isbn]),
                    libraryCatalog.linkByISBN(isbn));
            // place this link prominently by the booktitle
            var t = doc.getElementById("_ctl9_title");
            t.parentNode.insertBefore(link, t.nextSibling);
            t.parentNode.insertBefore(doc.createTextNode(" "), t.nextSibling);
        } 
    } 
});

// fix up the WAM page that says "The address you are trying to access is invalid."
if (libxProxy != null && libxProxy.type == "wam") {
    // this matches on a WAM DNS'ed URL
    var rexp = new RegExp("\\d+\\-(.*)\\." + libxProxy.url.replace(/\./g, "\\."));
    new DoForURL(rexp, function(doc, m) {
        var err = xpathFindSingle(doc, "//*[contains(text(),'The address you are trying to access is invalid')]");
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

// on the booklistonline page, replace the link to worldcatlibraries 
// with a local link.  Suggested by Melissa Belvadi
new DoForURL(/booklistonline\.com.*show_product/, function (doc) {
    var n = xpathFindNodes(doc, "//a[contains(@href,'worldcatlibraries')]");
    for (var i = 0; i < n.length; i++) {
        var isbn = isISBN(n[i].textContent);
        if (isbn) {
            var newlink = makeLink(doc,
                libxGetProperty("isbnsearch.label",
                    [libraryCatalog.name, isbn]),
                libraryCatalog.linkByISBN(isbn));
            n[i].parentNode.insertBefore(newlink, n[i]);
            n[i].parentNode.insertBefore(doc.createTextNode(" "), n[i]);
            // uncomment this to remove the worldcatlibraries link
            // n[i].parentNode.removeChild(n[i]);
        }
    }
});

// invoke autolink on all pages, if active
var autolink = new DoForURL(/.*/, function (doc) {
    if (libxConfig.options.autolink_active)
        libxRunAutoLink(doc, false); // false -> not right away
});

// exclude OpenURL resolver page if using sersol
if (openUrlResolver && openUrlResolver.type == "sersol") {
    autolink.exclude = [openUrlResolver.url.replace("http://", "")];
}

} //end of initializeDoForUrls

// vim: ts=4
