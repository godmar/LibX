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

libxEnv.getBoolPref = function (pref, defvalue) {
    return defvalue;
}
libxEnv.getIntPref = function (pref, defvalue) {
    return defvalue;
}
libxEnv.openSearchWindow = function (url, donoturiencode) {
    if (typeof url == "string") {
        /* GET */
        if (donoturiencode == null || donoturiencode == false) {
            var url2 = encodeURI(url);
        } else {
            var url2 = url;
        }
        window.open(url2);
    } else {
        /* POST - create a hidden POST form, populate and submit it. */
        var target = url[0];
        var postdata = url[1];
        var form = document.createElement("form");
        form.setAttribute("method", "POST");
        form.setAttribute("action", url[0]);
        form.style.display = 'none';
        var arg = url[1].split(/&/);
        for (var i = 0; i < arg.length; i++) {
            var field = document.createElement("input");
            var namevalue = arg[i].split("=");
            field.setAttribute("name", namevalue[0]);
            field.setAttribute("value", namevalue[1]);
            form.appendChild(field);
        }
        document.body.appendChild(form);    // needed?
        form.submit();
    }
}
libxEnv.writeLog = function (msg, type) {
    if (type !== undefined)
            return;
    alert("writeLog: " + msg);
}
libxEnv.logTypes = {
    magic: 'Magic',
    xpath: 'XPath'
};

/* remove this and make it so it can use libxInitializeCatalogs in libx.js ... */
var catalogs = new Array();
function libxClientSideCatalogInit(configurl) {

    function copyXMLAttributestoJS (fromXML, toJS) {
        for (var j = 0; j < fromXML.attributes.length; j++) {
            toJS[fromXML.attributes[j].nodeName] = fromXML.attributes[j].nodeValue;
        }
    }

    /*
     * In the original FF, these were read from a XUL element.
     * See libx.ie.js
     */
    libxDropdownOptions = {
        'Y' : 'Keyword',
        't' : 'Title',
        'jt': 'Journal Title',
        'at': 'Article Title',
        'a' : 'Author',
        'd' : 'Subject',
        'm' : 'Genre',
        'i' : 'ISBN/ISSN',
        'c' : 'Call Number',
        'j' : 'Dewey',
        'doi': 'DOI',
        'pmid': 'PubMed ID'
    };

    var xmlhttp = libxGetUrl(configurl, null, false);
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
        case "centralsearch":
            cat = new CentralSearch();
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
        case "custom":
        case "openurlresolver":
            // cat = new OpenURLCatalog();
            cat = { xisbn : { },
                    search: function () { 
                        alert('this catalog is not yet implemented for online testing, but it should work in your build'); } }
            break;
        // whikloj@cc.umanitoba.ca - 2007-06-20
        case "web2": 
            cat = new Web2OPAC();
            break;
        default:
            continue;
        }
        copyXMLAttributestoJS(xmlCat, cat);

        /* find xisbn child (should be first child in current DTD) */
        for (var k = 0; k < xmlCat.childNodes.length; k++) {
            var xisbnNode = xmlCat.childNodes[k];
            if (xisbnNode.nodeName == "xisbn")
                copyXMLAttributestoJS ( xisbnNode, cat.xisbn );
        }

        catalogs.push (cat);
    }

    // override libxDropdownOptions's option with options defined in config
    var xmlSearchOptions = configXML.getElementsByTagName("searchoption");
    for (var i = 0; i < xmlSearchOptions.length; i++) {
        var xmlOption = xmlSearchOptions[i];
        libxDropdownOptions[xmlOption.getAttribute("value")] = xmlOption.getAttribute("label");
    }
}

// -----------------
function props(x) {
    var s = "";
    if (typeof (x) == "array") {
        s += "[";
        for (var i = 0; i < x.length; i++) {
            s += i + "=" + props(x[i]) + ",";
        }
        s += "]";
    } else
    if (typeof (x) == "object") {
        s += "{";
        for (var k in x) {
            s += k + ":" + props(x[k]) + ",";
        }
        s += "}";
    } else
    if (typeof (x) == "function") {
        return "function () { }";
    } else {
        return String(x);
    }
    return s;
}
// -----------------

function libxTestSearch(catindex, type, term)
{
    type = document.getElementById(type).value;
    term = document.getElementById(term).value;
    try {
        var u = catalogs[catindex].search([{ searchType: type, searchTerms: term }]);
    } catch (er) {
        libxEnv.writeLog(er + "\ncatalog #" + catindex + " is: " + props(catalogs[catindex]));
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

