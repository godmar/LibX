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
 *                 Michael Doyle ( vtdoylem@gmail.com )
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * Client-side implementation of libxEnv
 */

var libxEnv = {
getBoolPref: 
    function (pref, defvalue) {
        return defvalue;
    },
openSearchWindow:
    function (url) {
        window.open(url);
    },
writeLog:
    function (msg) {
        alert("writeLog: " + msg);
    },
};

/* remove this and make it so it can use libxInitializeCatalogs in libx.js ... */
var catalogs = new Array();
function libxClientSideCatalogInit(configurl) {
    var xmlhttp = libxGetUrl(configurl, null);
    var configXML = xmlhttp.responseXML;
    var xmlCatalogs = configXML.getElementsByTagName("catalogs")[0];

    for (var i = 0; i < xmlCatalogs.childNodes.length; i++) { 
        var xmlCat = xmlCatalogs.childNodes[i];
        var cat;
        switch (xmlCat.nodeName) {
        case "millenium":
            cat = new MilleniumOPAC();
            break;
        case "sfx":
            cat = new SFX();
            break;
        case "sersol":
            cat = new ArticleLinker();
            break;
        case "aleph":
            cat = new AlephOPAC();
            break;
        case "voyager":
            cat = new VoyagerOPAC();
            break;
        case "sirsi":
            cat = new SirsiOPAC();
            break;
        case "horizon":
            cat = new HorizonOPAC();
            break;
        case "bookmarklet":
            cat = new libxBookmarklet();
            break;
        case "scholar":
            cat = new libxScholarSearch();
            break;
        default:
            continue;
        }
        for (var j = 0; j < xmlCat.attributes.length; j++) {
            cat[xmlCat.attributes[j].nodeName] = xmlCat.attributes[j].nodeValue;
        }
        catalogs.push (cat);
    }
}

function libxTestSearch(catindex, type, term)
{
    type = document.getElementById(type).value;
    term = document.getElementById(term).value;
    try {
        var u = catalogs[catindex].search([{ searchType: type, searchTerms: term }]);
    } catch (er) {
        libxEnv.writeLog(er);
    }
}

// adapted from latest version published at
// http://jibbering.com/2002/4/httprequest.html
function libxGetUrl(url, cb, sync) {
    function getXHR() {
        var xmlhttp=false;
        /*@cc_on @*/
        /*@if (@_jscript_version >= 5)
        // JScript gives us Conditional compilation, we can cope with old IE versions.
        // and security blocked creation of the objects.
         try {
          xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
         } catch (e) {
          try {
           xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
          } catch (E) {
           xmlhttp = false;
          }
         }
        @end @*/
        if (!xmlhttp && typeof XMLHttpRequest!='undefined') {
                try {
                        xmlhttp = new XMLHttpRequest();
                } catch (e) {
                        xmlhttp=false;
                }
        }
        if (!xmlhttp && window.createRequest) {
                try {
                        xmlhttp = window.createRequest();
                } catch (e) {
                        xmlhttp=false;
                }
        }
        return xmlhttp;
    }

    var xmlhttp = getXHR();
    xmlhttp.open("GET", url, sync);
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4) {
            if (cb != null)
                cb(xmlhttp);
        }
    }
    xmlhttp.send(null);
    return xmlhttp;
}
