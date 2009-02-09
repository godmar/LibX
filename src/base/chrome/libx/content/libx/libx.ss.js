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
 * Server-side implementation of libx - for Rhino
 *
 * XXX move this to rhino/ subdir
 *
 */

// see http://java.sun.com/javase/6/docs/technotes/guides/scripting/programmer_guide/index.html#jsimport
importPackage(org.w3c.dom);
importPackage(javax.xml.xpath);
importPackage(javax.xml.parsers);
importClass(org.xml.sax.SAXException);

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
    var name = libx.edition.name['short'];  // short is future reserved word, Rhino respects that
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


/*
 *
 */
var thisFile = engine.get(engine.FILENAME);
var thisDir = thisFile.substring(0, thisFile.lastIndexOf('/') + 1);
function loadscript(script) {
    load(thisDir + script);
}
