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
var threshold1;
var threshold2;

function libxInitMagicSearch()
{
    threshold1 = libxEnv.getIntPref("libx.magic.threshold1", 50)/100.0;   // for author+title together
    threshold2 = libxEnv.getIntPref("libx.magic.threshold2", 60)/100.0;   // for author+title separately
}

/*
 * XXX rewrite this horrible junk piece of code as catalog object.
 */
function magicSearch(data, inpub, justmakeurl) 
{
    function handleMiss(url, data)
    {
        if (libxEnv.options.scholarmissurl != null) {
            // if so configured, libx can lead user to this URL on miss
            var onmissshow = libxEnv.options.scholarmissurl
                .replace(/%S/i, encodeURIComponent(data));

            libxEnv.openSearchWindow(onmissshow, true);
        }
    }

    function cosineSimilarity(str1, str2) 
    {
        var str1toks = str1.split(/\s+/);
        var str2toks = str2.split(/\s+/);

        function c(s) {
            return s.replace(/[:\.,\)]*$/, "").replace(/^[\(]*/, "");
        }
        for (var i = 0; i < str1toks.length; i++) {
            str1toks[i] = c(str1toks[i]);
        }
        for (var i = 0; i < str2toks.length; i++) {
            str2toks[i] = c(str2toks[i]);
        }
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
        libxEnv.writeLog(commonterms + " " + str1terms + " " + str2terms + " " + s, libxEnv.logTypes.magic);
        */
        return commonterms / Math.sqrt(str1terms * str2terms);
    }
    function magicNormalize(t) {
        t = t.replace(/^\s+/, "");    // remove leading whitespace
        t = t.replace(/\s+$/, "");    // remove trailing whitespace
        t = t.replace(/,+$/, "");     // remove trailing comma
        t = t.replace(/\./g, " ");    // switch all periods to spaces
        return t.toLowerCase();
    }

    var maxattempts = 5;

    libxEnv.writeLog("Searching for: \"" + data + "\"" +
                     (inpub ? " inpub: " + inpub : " - no publication given"),
                     libxEnv.logTypes.magic);
    var originaldata = data;
    data = magicNormalize(data);
    var baseurl = 'http://scholar.google.com/scholar?hl=en&lr=';
    if (inpub) {
        baseurl += '&as_publication=' + encodeURIComponent(inpub);
    }
    baseurl += '&q=';

    var url = baseurl + encodeURIComponent(data);
    
    // if justmakeurl is set, return URL
    if (justmakeurl)
        return url;

    // XXX: revisit this decision - right now, it would crash below if we assumed
    // openUrlResolver != null, but we should really open hits in any event.
    // if there is no OpenURL support, then there is no point in trying 
    // to read Google Scholar pages simply open the scholar page for the 
    // user to see.
    if (!libxEnv.openUrlResolver) { 
        libxEnv.openSearchWindow(url, true);
        return null;
    }

    var triedexact = false; // have we already tried the exact search (with a preceding '')

    for (var _attempt = 0; _attempt < maxattempts; _attempt++) {
        libxEnv.writeLog("Attempt #" + _attempt + ": " + url, libxEnv.logTypes.magic);

        var r = libxEnv.getDocument(url, null, null);

        // see if the query was bungled b/c of searchterms clutched together
        // Let us see if scholar says that we should drop some search terms
        var nf = r.match(/No pages were found containing <b>\"([^\"]*)\"<\/b>/);
        if (nf) {
            data = data.replace(nf[1], " ");    // drop the term
            url = baseurl + encodeURIComponent(data);   // rebuild search url
            continue;   // try again
        }

        // else we got results.  See if what we were looking for is here
        // Scholar now has "All articles | Recent articles choice" which sometimes shows up
        // account for it when finding the block of replies
        var div = r.match(/(<p class=g>[\s\S]*?)<\/div>/i);
        if (div) {
            var hits = div[1].split(/<p class=g>/);
            var found = false;
            for (var h = 0; h < hits.length; h++) {
                if (hits[h] == "")
                    continue;

                // see if we find OpenURL link to
                // They look like this
                // <a href=\"/url?sa=U&q=http://sfx.hul.harvard.edu:82/sfx_local%3Fsid%3Dgoogle%26aulast
                // captures entire OpenURL as openurl[1]
                // captures openURL suffix as openurl[2]
                var oregexp = /href=\"(\S*?sid=google&amp;([^\"]*))\"/i;
                var openurl = hits[h].match(oregexp);
                // if we captured refworks link here, try again.
                if (openurl != null && openurl[0].match(/refworks/)) {
                    openurl = hits[h].replace(openurl[0], "").match(oregexp);
                }

                // we dont skip to the next entry here, because we are now checking if maybe there is a 
                // direct link to the paper --- XXX make this a configurable decision

                // strip <html> tags and return cosine similarity with search terms 
                var getcosine = function(comp) {
                    var t = comp.replace(/<.*?>/g, "").replace(/&nbsp;/g, " ")
                            .replace(/^\s*/, "").replace(/\s*$/, "");
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
                    titleurl = title[1].match(/<a href=\"([^\"]*)\"/i);
                    if (titleurl) titleurl = titleurl[1];       // capture match if any

                    titleplusauthor += title[1];
                    titlesim = getcosine(title[1]);
                    libxEnv.writeLog("CosineSimilarity w/ titleline=" + titlesim + " \""
                                     + title[1].replace(/<.*?>/g, "") + "\"",
                                     libxEnv.logTypes.magic);
                }

                var auline = hits[h].replace(/&hellip;/, " ").match(/<span class=\"a\">([\s\S]*?)<\/span>/);
                var ausim = 0;
                if (auline != null) {
                    titleplusauthor += " " + auline[1];
                    ausim = getcosine(auline[1]);
                    libxEnv.writeLog("CosineSimilarity w/ authorline=" + ausim
                                     + " " + auline[1].replace(/<.*?>/g, ""),
                                     libxEnv.logTypes.magic);
                }
                if (titleplusauthor != "") {
                    var tplusauthsim = getcosine(titleplusauthor);
                    libxEnv.writeLog("CosineSimilarity w/ title+authorline="
                                     + tplusauthsim, libxEnv.logTypes.magic);
                }

                if (tplusauthsim > threshold1 || ((titlesim + ausim) > threshold2)) {
                    if (!(openurl || titleurl)) {
                        libxEnv.writeLog("Above threshold, but found neither title nor OpenURL; title[1] was="
                                             + title[1], libxEnv.logTypes.magic);
                        continue;       // match, but no link
                    }
                    // we prefer to show the OpenURL, if any, but otherwise we go straight to Scholars URL
                    var vtu = titleurl; // by default we open the URL Google provides
                    var display = !libxEnv.options.suppressscholardisplay;
                    if (openurl) {
                        var openurlpath = decodeURIComponent(openurl[2]).replace(/^&/, "");

                        // for reasons unknown, Google sticks unicode characters into its URLs
                        // it appears Firefox doesn't handle those well, so let's remove them.
                        // that's a &rsquo; aka &#8217; aka \u2019 char, probably UTF-8 encoded (?!)
                        openurlpath = openurlpath.replace(/%E2%80%99/ig, "'");

                        // as of Feb 2007, Scholar places the correct OpenURL in the
                        // href element, which means & is encoded as &.
                        openurlpath = openurlpath.replace(/&amp;/g, "&")
                                                 .replace(/&lt;/g, "<")
                                                 .replace(/&gt;/g, ">");

                        // sending the original data in a (non-standard) OpenURL field
                        // allows an OpenURL resolver to offer an option to correct for
                        // wrong positives.  Used for Maryville.
                        if (libxEnv.options.sendorigdatawithopenurl) { 
                            openurlpath += "&origdata=" + encodeURIComponent(data);
                        }

                        vtu = libxEnv.openUrlResolver.completeOpenURL(openurlpath);
                        display = true;
                        libxEnv.writeLog('OpenURL: ' + vtu, libxEnv.logTypes.magic);
                    } else {
                        vtu = decodeURIComponent(vtu);
                        libxEnv.writeLog('DirectURL: ' + vtu, libxEnv.logTypes.magic);
                    }
                    if (display) {
                        libxEnv.openSearchWindow(vtu, true);
                        found = true;
                    }
                    break;
                } else {
                    libxEnv.writeLog("rejected because below threshold, thresholds are " 
                        + threshold1 + " and " + threshold2, libxEnv.logTypes.magic);
                }
            }

            if (h == hits.length) {
                libxEnv.writeLog("I received " + hits.length +
                                 " hits in Scholar, but no matches were found",
                                 libxEnv.logTypes.magic);
            }

            // in some cases, Scholar finds it only when searched as an exact match
            if (!found && !triedexact) {
                triedexact = true;
                data = '"' + data + '"';
                url = baseurl + encodeURIComponent(data);   // rebuild search url
                continue;   // try again
            }

            // on a hit, we have already opened the OpenURL window
            if (!found)
                handleMiss(url, originaldata);

            if (libxEnv.options.suppressscholardisplay)
                return null;

            // show google scholar page also
            if (found) {
                libxEnv.openSearchWindow(url, true, "libx.newtab" );       // in second tab if we got a hit
            } else {
                libxEnv.openSearchWindow(baseurl + encodeURIComponent(originaldata), true);  // as primary window if not
            }
            return null;
        } else {
            libxEnv.writeLog("couldn't find result <div> in this scholar result: "
                             + r, libxEnv.logTypes.magic);
        }

        // scholar did not find anything.  Let us see if they have a "Did you mean" on their page 
        // scholar.google.com doesnt put double-quotes around the href attributes - wth?
        var dym = r.match(/Did you mean:\s+<\/font><a\s+href=(\/scholar\S*)\s/i);
        if (dym) {
            url = 'http://scholar.google.com' + dym[1]; // google embeds a URL for the alternative search
            continue;   // try again
        }

        // we dont know what else to do, just take the user to the google scholar page
        handleMiss(url, originaldata);

        if (!libxEnv.options.suppressscholardisplay)
            libxEnv.openSearchWindow(baseurl + encodeURIComponent(originaldata), true);
        return null;
    }
    return null;
}

// vim: ts=4
