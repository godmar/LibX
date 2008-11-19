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
libx.ff = { };

libxEnv = {
    getBoolPref : function (pref, defvalue) {
        return defvalue;
    },
    getIntPref : function (pref, defvalue) {
        return defvalue;
    },
    openSearchWindow : function (url) {
        if (typeof url == "string") {
            /* GET */
            window.open(url);
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
    },
    writeLog : function (msg, type) {
        if (type !== undefined)
                return;
    // alert("writeLog: " + msg);
    },
    logTypes : {
        magic: 'Magic',
        xpath: 'XPath'
    },
    getXMLConfig : function (invofcc) {
        libxGetUrl(invofcc.url, function (xhr) { 
            invofcc.onload(xhr); 
        }, true);
    }
};

function libxClientSideCatalogInit(configurl) {
    var editionConfigurationReader = new libx.config.EditionConfigurationReader( {
    	url: configurl,
    	onload: function (edition) {
    		libx.edition = edition;
    	}
    } );
}

// run a test search against catalog #catindex
function libxRunAdvancedTestSearch(catindex, search)
{
    try {
        var u = libx.edition.catalogs[catindex].search(search);
    } catch (er) {
        libxEnv.writeLog(er + "\ncatalog #" + catindex + " is: " + props(libx.edition.catalogs[catindex]));
    }
}

function libxTestSearch(catindex, type, term)
{
    type = document.getElementById(type).value;
    term = document.getElementById(term).value;
    libxRunAdvancedTestSearch(catindex, [{ searchType: type, searchTerms: term }]);
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

