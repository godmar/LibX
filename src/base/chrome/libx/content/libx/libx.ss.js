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
 * Server-side implementation of libxEnv
 */

// see http://java.sun.com/javase/6/docs/technotes/guides/scripting/programmer_guide/index.html#jsimport
importPackage(org.w3c.dom);
importPackage(javax.xml.xpath);
importPackage(javax.xml.parsers);
importClass(org.xml.sax.SAXException);

var libxEnv = {
getBoolPref: 
    function (pref, defvalue) {
        return defvalue;
    },
getIntPref: 
    function (pref, defvalue) {
        return defvalue;
    },
openSearchWindow:
    function (url) {
        window.open(url);
    },
getXMLConfig: 
    function () {
        return this._configXML;
    },
writeLog:
    function (msg, type) {
        if (type !== undefined)
                return;
        println("writeLog: " + msg);
    },
logTypes: {
      magic: 'Magic',
      xpath: 'XPath'
    },
//libx.bd.xpath.findNodes(libxEnv.xmlDoc.xml, "/edition/options/option");
xpath: {
        // returns javascript array of nodes
        findNodes: function (doc, xpathexpr) {
            /*XPathFactory*/var factory = XPathFactory.newInstance();
            /*XPath*/ var xpath = factory.newXPath();
            /*XPathExpression*/ var expr = xpath.compile(xpathexpr);
            /*NodeList*/var nodes = expr.evaluate(doc, XPathConstants.NODESET);

            var r = new Array();
            if (nodes.getLength() == 0)
                return null;

            for (var i = 0; i < nodes.getLength(); i++) {
                r.push(nodes.item(i)); 
            }
            /*
            for (i = 0; i < r.length; i++)
                println("r #" + i + " " + r[i]);
            */
            return r;
        }
    }
};

/* remove this and make it so it can use libxInitializeCatalogs in libx.js ... */
var catalogs = new Array();
var configdir;
function libxServerSideInit(_configdir) {

    configdir = _configdir;
    var configurl = _configdir + "/config.xml";

    function copyXMLAttributestoJS (fromXML, toJS) {
        for (var j = 0; j < fromXML.attributes.length; j++) {
            toJS[fromXML.attributes.item(j).nodeName] = fromXML.attributes.item(j).nodeValue;
        }
    }

    /*DocumentBuilderFactory*/var domFactory = DocumentBuilderFactory.newInstance();
    domFactory.setNamespaceAware(true); // never forget this!
    /*DocumentBuilder*/var builder = domFactory.newDocumentBuilder();
    /*Document*/var configXML = builder.parse(configurl);
    /*
        var parser = new org.cyberneko.html.parsers.DOMParser();
        parser.parse(configurl);
        var configXML = parser.getDocument();
    */
    libxEnv._configXML = configXML;

    var xmlCatalogs = configXML.getElementsByTagName("catalogs").item(0);

    for (var i = 0; i < xmlCatalogs.childNodes.length; i++) { 
        var xmlCat = xmlCatalogs.childNodes.item(i);
        var cat;
        switch (String(xmlCat.nodeName.toLowerCase())) {
        default:
            if (libx.catalog.factory[xmlCat.nodeName] !== undefined) {
                cat = new libx.catalog.factory[xmlCat.nodeName]();
                break;
            }
            /* FALL THROUGH */
            println("catalog not supported: " + xmlCat.nodeName.toLowerCase());
            continue;
        }
        copyXMLAttributestoJS(xmlCat, cat);

        /* find xisbn child (should be first child in current DTD) */
        for (var k = 0; k < xmlCat.childNodes.length; k++) {
            var xisbnNode = xmlCat.childNodes.item(k);
            if (xisbnNode.nodeName == "xisbn")
                copyXMLAttributestoJS ( xisbnNode, cat.xisbn );
        }

        catalogs.push (cat);
    }

    libxEnv.xmlDoc = libxGetConfigXML();

    libxEnv.xmlDoc.copyAttributes = function(xnode, obj) {
        for (var i = 0; i < xnode.attributes.length; i++) {
            var attr = xnode.attributes.item(i);
            obj[attr.nodeName] = libx.utils.types.normalize(attr.nodeValue);
        }
    };

    libxInitializeOptions();
}

function writeOpenSearch(f, c) {
    f.println('<?xml version="1.0" encoding="UTF-8"?>');
    f.println('<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">');
    f.println('<ShortName>' + c.shortName + '</ShortName>');
    f.println('<LongName>' + c.longName + '</LongName>');
    f.println('<Description>');
    f.println('Search the ' + c.catalogName);
    f.println('</Description>');
    f.println('<Tags>library catalog opac</Tags>');
    f.println('<Contact></Contact>');
    /* can occur multiple times for different 'type's, can also support method="POST" 
     * See http://www.loc.gov/standards/sru/march06-meeting/slides/dglsru-opensearch/standards/opensearch/description
     */
    f.println('<Url type="text/html" template="' + c.urlTemplate + '"/>');
    f.println('<Attribution>' + c.attribution + '</Attribution>');
    f.println('<Developer>LibX auto-generated</Developer>');
    f.println('<SyndicationRight>open</SyndicationRight>');
    f.println('<Language>en-US</Language>');
    f.println('<AdultContent>false</AdultContent>');
    f.println('<OutputEncoding>UTF-8</OutputEncoding>');
    f.println('<Query role="example" searchTerms="xml"/>');
    f.println('<Image height="16" width="16">' + c.iconPath + '</Image>');
    f.println('</OpenSearchDescription>');
}

function libxWriteOpenSearchDescriptions() {
    function encodeEntities(s) {
        var result = '';
        for (var i = 0; i < s.length; i++) {
            var c = s.charAt(i);
            result += {'<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;'}[c] || c;
        }
        return result;
    }

    var icon = libx.edition.options['icon'].replace("chrome:\/\/libx\/skin\/", "");
    //println("icon is: " + icon);
    var last = String(configdir).replace(/.*editions/, "");
    println("last is: " + last);
    var name = libx.bd.xpath.findNodes(libxEnv.xmlDoc.xml, "/edition/name")[0];
    //println("name.short is: " + name.getAttribute("short"));
    for (var i = 0; i < (catalogs.length < 1 ? 0 : 1); i++) {
        var opts = catalogs[i].options.split(";");
        for (var j = 0; j < 1; j++) {
            var opt = opts[j];
            var fname = configdir + "/cat" + i + opt + ".xml";
            println("catalog#" + i + " " + fname);

            var fw = new java.io.PrintWriter(java.io.FileWriter(fname));
            writeOpenSearch(fw, {
                shortName: name.getAttribute('short'),
                longName: name.getAttribute('long'),
                urlTemplate: encodeEntities(catalogs[i].makeSearch(opt, "{searchTerms}")),
                catalogName: catalogs[i].name + " by " + libx.edition.searchoptions[opt],
                iconPath: org.libx.editionbuilder.Config.httpeditionpath + last + "/" + icon,
                attribution: name.getAttribute('adaptedby')
            });
            fw.close();
        }
    }
    return "wrote " + fname;
}

function getSearchUrl(catindex, stype, sterm) {
    var r = catalogs[catindex].makeSearch(stype, sterm);
    if (typeof (r) == "string")
        return r;
    return "POST not supported for catalog: " + catalogs[catindex].name;
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
        libx.log.write(er + "\ncatalog #" + catindex + " is: " + props(catalogs[catindex]));
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

/*
 *
 */
var thisFile = engine.get(engine.FILENAME);
var thisDir = thisFile.substring(0, thisFile.lastIndexOf('/') + 1);
function loadscript(script) {
    load(thisDir + script);
}

loadscript("isbnutils.js");
loadscript("libx.js");
loadscript("config.js");
loadscript("openurl.js");
loadscript("catalogs/catalog.js");
loadscript("catalogs/milleniumopac.js");
loadscript("catalogs/horizonopac.js");
loadscript("catalogs/voyageropac.js");
loadscript("catalogs/alephopac.js");
loadscript("catalogs/sirsiopac.js");
loadscript("catalogs/centralsearch.js");
loadscript("catalogs/openURLCatalog.js");
loadscript("catalogs/web2opac.js");
loadscript("magicsearch.js");

