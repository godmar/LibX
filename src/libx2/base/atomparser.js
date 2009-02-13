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
 * Contributor(s): 
 *
 * ***** END LICENSE BLOCK ***** */

(function () {

var debug = false;

var ns = {
    atom:	"http://www.w3.org/2005/Atom",
    libx2:	"http://libx.org/xml/libx2"
};

var libx2Clauses = [ "include", "exclude", "require", "guardedby", "body" ];
var libx2RegexpClauses = [ "include", "exclude" ];

/**
 * Resolver 'url' relative to 'base'
 */
function resolveURL(baseURL, url)
{
    if (url.match(/^[a-z]+:/)) {    // absolute URL
        return url;
    } else
    if (url.match(/\/.*/)) {        // same host+protocol, but absolute path
        return baseURL.match(/^[a-z]+:\/\/[^\/]+\//) + url.replace(/^\//, "");
    } else {
        // relative path
        return baseURL.match(/^.*\//) + url;
    }
}


/**
 * Namespace resolver for namespaces: libx2, atom
 *  atom:	"http://www.w3.org/2005/Atom"
 *  libx2:	"http://libx.org/xml/libx2"
 */
libx.libapp.nsResolver = ns;

/**
 * @class
 *
 * Hierarchical visitor for packages.
 * Visit all modules, libapps, and packages reachable from
 * a given package.
 */
libx.libapp.PackageVisitor = libx.core.Class.create(
    /** @lends libx.libapp.PackageVisitor.prototype */{
    onpackage: function (pkg) {
        for (var i = 0; i < pkg.entries.length; i++)
            handleEntry(this, pkg.entries[i].url);
    },
    onlibapp: function (libapp) {
        for (var i = 0; i < libapp.entries.length; i++)
            handleEntry(this, libapp.entries[i].url);
    },
    onmodule: function (module) {
    }
});

function handleEntry(visitor, url) {

    function handleEntryBody(xmlDoc, baseURL, entryNode) {
        var libx2Node = libx.utils.xpath.findSingleXML(
            xmlDoc, "./libx2:*", entryNode, ns
        );
        if (libx2Node == null) {
            libx.log.write(baseURL + ": entry does not contain any libx2:* node");
            return;
        }

        var desc = libx.utils.xpath.findSingleXML(xmlDoc, "./atom:title/text()",
            entryNode, ns);
        desc = desc != null ? desc.nodeValue : "no description";

        var nodeInfo = { 
            baseURL: baseURL,
            atomEntry: entryNode,
            description: desc,
            entries: []
        };

        var clauses = libx2Clauses;
        for (var i = 0; i < clauses.length; i++) {
            var clause = clauses[i];
            var clauseNodes = libx.utils.xpath.findNodesXML(
                xmlDoc, "./libx2:" + clause, libx2Node, ns);

            nodeInfo[clause] = new Array();
            if (clauseNodes == null)
                continue;

            for (var j = 0; j < clauseNodes.length; j++) {
                nodeInfo[clause].push(String(clauseNodes[j].firstChild.nodeValue));
            }
        };

        // replace 'include', 'exclude', etc. with compiled RegExp objects
        for (var i = 0; i < libx2RegexpClauses.length; i++) {
            var rClause = libx2RegexpClauses[i];
            for (var j = 0; j < nodeInfo[rClause].length; j++) {
                try {
                    var m = nodeInfo[rClause][j].match(/\/(.*)\/(.*)/);
                    nodeInfo[rClause][j] = new RegExp(m[1], m[2]);
                } catch (e) {
                    libx.log.write("invalid regular expression: " + nodeInfo[rClause][j]);
                    nodeInfo[rClause].splice(j--, 1);
                }
            }
        }

        var libxEntries = libx.utils.xpath.findNodesXML(
            xmlDoc, "./libx2:entry", libx2Node, ns);

        for (var i = 0; libxEntries != null && i < libxEntries.length; i++) {
            nodeInfo.entries.push({
                url: resolveURL(baseURL, libxEntries[i].getAttribute('src')),
                libxEntry: libxEntries[i]
            });
        }
 
        var visitorMethodName = "on" + String(libx2Node.localName);
        if (visitor[visitorMethodName])
            visitor[visitorMethodName](nodeInfo);
    }

    var pathComp = url.split(/\//);
    var pathDir = String(url.match(/.*\//));
    var pathBase = url.replace(/.*\//, "");

    if (debug) libx.log.write("url= " + url + " path=" + pathDir + " base=" + pathBase);

    libx.cache.globalMemoryCache.get({
        url: pathDir,
        dataType: "xml",
        success: function (xmlDoc, status, xhr) {
            var xpathExpr = "//atom:entry[atom:id/text() = '" + url + "']";
            var entry = libx.utils.xpath.findSingleXML(xmlDoc, xpathExpr, xmlDoc, ns);
            if (entry != null) {
                handleEntryBody(xmlDoc, pathDir, entry);
            } else {
                libx.cache.globalMemoryCache.get({
                    url: url,
                    dataType: "xml",
                    success: function (xmlDoc, status, xhr) {
                        handleEntryBody(xmlDoc, pathDir, xmlDoc.documentElement);
                    }
                });
            }
        }
    });
}

/**
 * @class
 */
libx.libapp.PackageWalker = libx.core.Class.create(
    /** @lends libx.libapp.PackageWalker.prototype */{
    /**
     * @constructs
     * @param {String} rootPackageId - URL describing the entry/id 
     *         of a package or libapp.
     */
    initialize: function (rootPackageId) {
        this.rootPackage = rootPackageId;
    },

    /**
     * Apply visitor to all packages, libapps, and modules
     * that are referenced from given root
     */
    walk : function (visitor) {
        handleEntry(visitor, this.rootPackage);
    }
});

}) ();
