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
 * The Initial Developer of the Original Code is Godmar Back (godmar@gmail.com)
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer and Virginia Tech. All Rights Reserved.
 *
 * Contributor(s):
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * This function runs a set of search terms through Google scholar and examines 
 * the html it returns for hits.
 *
 * If google scholar says "No pages were found containing X" we remove X from the 
 * search term and try again.
 * If google scholar says "Did you mean X" we follow the link it provides
 * We do 5 iterations before giving up.
 *
 * If we have at least one hit, we do this for each hit:
 *  - skip it if it doesn't have an OpenURL
 *  - (but do include it if it's only a CITATION!)
 *  - compute the cosine similarity of search data and title+author from google
 *      -> if greater than threshold1, rewrite openurl and display -> done
 *  - compute the cosine similarity of search data and title and author from google SEPARATELY
 *      -> if sum of the two is greater than threshold2, rewrite openurl and display -> done
 * We will also open the original Google Scholar result in a separate tab in any case.
 */
var threshold1 = nsPreferences.getIntPref("libx.magic.threshold1", 50)/100.0;   // for author+title together
var threshold2 = nsPreferences.getIntPref("libx.magic.threshold2", 60)/100.0;   // for author+title separately

function magic_log(msg) {
    if (!nsPreferences.getBoolPref("libx.magic.debug", false))
        return;

    var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
               .getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage("magic: " + msg);
}

function magicNormalize(t) {
    t = t.replace(/^\s+/, "");    // remove leading whitespace
    t = t.replace(/\s+$/, "");    // remove trailing whitespace
    t = t.replace(/,+$/, "");     // remove trailing comma
    t = t.replace(/\./g, " ");    // switch all periods to spaces
    return t.toLowerCase();
}

function magicSearch(data, inpub, buttonpressed) {
    var maxattempts = 5;

    magic_log("Searching for: \"" + data + "\"" + (inpub ? " inpub: " + inpub : "no publication given"));
    var originaldata = data;
    data = magicNormalize(data);
    var baseurl = 'http://scholar.google.com/scholar?hl=en&lr=';
    if (inpub) {
        baseurl += '&as_publication=' + encodeURIComponent(inpub);
    }
    baseurl += '&q=';

    var url = baseurl + data;
    
    // if there is no OpenURL support, then there is no point in trying to read Google Scholar pages
    // simply open the scholar page for the user to see.
    // the same is done if "dumb.scholar.button" is activated
    if (!openUrlResolver || (buttonpressed != null && libxGetProperty("dumb.scholar.button"))) {
        openSearchWindow(url);
        return;
    }
    var triedexact = false; // have we already tried the exact search (with a preceding ")

    for (var _attempt = 0; _attempt < maxattempts; _attempt++) {
        magic_log("Attempt #" + _attempt + ": " + url);

        var req = new XMLHttpRequest();
        req.open('GET', encodeURI(url), false);    // synchronous request
        // it will send along whatever cookie is already set by the user, so there's no need to set a cookie here
        req.send(null);
        var r = req.responseText;
        
        // see if the query was bungled b/c of searchterms clutching together
        // Let's see if scholar says that we should drop some search terms
        var nf = r.match(/No pages were found containing <b>\"([^\"]*)\"<\/b>/);
        if (nf) {
            data = data.replace(nf[1], " ");    // drop the term
            url = baseurl + data;   // rebuild search url
            continue;   // try again
        }

        // else we got results.  See if what we were looking for is here
        // Scholar now has "All articles | Recent articles choice" which sometimes shows up
        // account for it when finding the block of replies
        var div = r.match(/(<div>|recent articles.*?\/table>)\s*(<p class=g>[\s\S]*?)<\/div>/i);
        if (div) {
            var hits = div[2].split(/<p class=g>/);
            var found = false;
            for (var h = 0; h < hits.length; h++) {
                if (hits[h] == "")
                    continue;

                // see if we find OpenURL link to
                // They look like this
                // <a href="/url?sa=U&q=http://sfx.hul.harvard.edu:82/sfx_local%3Fsid%3Dgoogle%26aulast
                // captures entire OpenURL as openurl[1]
                // captures openURL suffix as openurl[2]
                var oregexp = /\"\/url\S*q=(\S*%3Fsid%3Dgoogle([^\"]*))\"/;
                var openurl = hits[h].match(oregexp);
                // if we captured refworks link here, try again.
                if (openurl != null && openurl[0].match(/refworks/)) {
                    openurl = hits[h].replace(openurl[0], "").match(oregexp);
                }
                // we don't skip to the next entry here, because we're now checking if maybe there's a 
                // direct link to the paper --- XXX make this a configurable decision

                // strip <html> tags and return cosine similarity with search terms 
                var getcosine = function(comp) {
                    var t = comp.replace(/<.*?>/g, "");
                    t = magicNormalize(t);
                    return cosineSimilarity(t, data);
                }

                var titleplusauthor = "";

                var title = hits[h].replace(/&hellip;/, " ").match(/<span class=\"w\">([\s\S]*?)<\/span>/);
                if (title == null && hits[h].match(/\[CITATION\]/)) {
                    title = hits[h].replace(/&hellip;/, " ").match(/\[CITATION\]([\s\S]*?)<br>/);
                }
                var titleurl = null;
                var titlesim = 0;
                if (title != null) {
                    // see if GS provides a URL which we will present to the user if an OpenURL is absent
                    // <a href="/url?sa=U&q=http://www.smartlabcentre.com/phdstudentsite/sher/DoruffDossier04.pdf">
                    titleurl = title[1].match(/<a href=\"\/url.*q=([\s\S]*)\">/i);
                    if (titleurl) titleurl = titleurl[1];       // capture match if any

                    titleplusauthor += title[1];
                    titlesim = getcosine(title[1]);
                    magic_log("CosineSimilarity w/ titleline=" + titlesim + " \"" + title[1].replace(/<.*?>/g, "") + "\"");
                }

                var auline = hits[h].replace(/&hellip;/, " ").match(/<font color=green>([\s\S]*?)<\/font>/);
                var ausim = 0;
                if (auline != null) {
                    titleplusauthor += " " + auline[1];
                    ausim = getcosine(auline[1]);
                    magic_log("CosineSimilarity w/ authorline=" + ausim + " " + auline[1].replace(/<.*?>/g, ""));
                }
                if (titleplusauthor != "") {
                    var tplusauthsim = getcosine(titleplusauthor);
                    magic_log("CosineSimilarity w/ title+authorline=" + tplusauthsim);
                }

                if (tplusauthsim > threshold1 || ((titlesim + ausim) > threshold2)) {
                    if (!(openurl || titleurl)) {
                        continue;       // match, but no link
                    }
                    // we prefer to show the OpenURL, if any, but otherwise we go straight to Scholar's URL
                    var vtu = titleurl; // by default we open the URL Google provides
                    var display = !libxGetProperty("suppress.scholar.display");
                    if (openurl) {
                        var openurlpath = decodeURIComponent(openurl[2]);

                        // sending the original data in a (non-standard) OpenURL field
                        // allows an OpenURL resolver to offer an option to correct for
                        // wrong positives.  Used for Maryville.
                        if (libxGetProperty("send.origdata.withopenurl")) {
                            openurlpath += "&origdata=" + data;
                        }

                        vtu = openUrlResolver.completeOpenURL(openurlpath);
                        display = true;
                        magic_log('OpenURL: ' + vtu);
                    } else {
                        magic_log('DirectURL: ' + vtu);
                    }
                    if (display) {
                        vtu = decodeURIComponent(vtu); // openSearchWindow wants to URI-encode it 
                        openSearchWindow(vtu);
                        found = true;
                    }
                    break;
                }
            }

            if (h == hits.length) {
                magic_log("I received " + hits.length + " hits, but no matches were found - maybe no affiliation cookie is set");
            }

            // in some cases, Scholar finds it only when searched as an exact match
            if (!found && !triedexact) {
                triedexact = true;
                data = '"' + data;
                url = baseurl + data;   // rebuild search url
                continue;   // try again
            }

            // on a hit, we've already opened the OpenURL window
            if (!found)
                handleMiss(url, originaldata);

            if (libxGetProperty("suppress.scholar.display")) 
                return;

            // show google scholar page also
            if (found) {
                getBrowser().addTab(encodeURI(url));       // in second tab if we got a hit
            } else {
                openSearchWindow(url);          // as primary window if not
            }
            return;
        }

        // scholar didn't find anything.  Let's see if they have a "Did you mean" on their page 
        // scholar.google.com doesn't put double-quotes around the href attributes - wth?
        var dym = r.match(/Did you mean:\s+<\/font><a\s+href=(\/scholar\S*)\s/i);
        if (dym) {
            url = 'http://scholar.google.com' + dym[1]; // google embeds a URL for the alternative search
            continue;   // try again
        }

        // we don't know what else to do, just take the user to the google scholar page
        handleMiss(url, originaldata);

        if (!libxGetProperty("suppress.scholar.display")) 
            openSearchWindow(url);
        return;
    }
}

function handleMiss(url, data)
{
    // if so configured, libx can lead user to this URL on miss
    var onmissshow = libxGetProperty("scholarmiss.url", [data]);

    if (onmissshow) {
        openSearchWindow(onmissshow);
    }
}

function cosineSimilarity(str1, str2) {
    var str1toks = str1.split(/\s+/);
    var str2toks = str2.split(/\s+/);
    var str1terms = 0;
    var str2terms = 0;

    var uniq = new Object();
    var uniqterms = 0;
    for (var i in str1toks) {
        if (uniq[str1toks[i]] == undefined) {
            uniq[str1toks[i]] = true;
            str1terms++;
            uniqterms++;
        }
    }
    var s2 = new Object();
    for (var i in str2toks) {
        if (uniq[str2toks[i]] == undefined) {
            uniq[str2toks[i]] = true;
            uniqterms++;
        }
        if (s2[str2toks[i]] == undefined) {
            s2[str2toks[i]] = true;
            str2terms++;
        }
    }
    var commonterms = (str1terms + str2terms - uniqterms);
    /*
    var s = "";
    for (var k in uniq) { s += " " + k; }
    magic_log(commonterms + " " + str1terms + " " + str2terms + " " + s);
    */
    return commonterms / Math.sqrt(str1terms * str2terms);
}

// vim: ts=4

