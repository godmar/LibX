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

var libx2Clauses = [ "include", "exclude", "require", "guardedby", "body", "regexptexttransformer" ];
var libx2ArrayClauses = { include : 1, exclude : 1, guardedby : 1, require : 1, regexptexttransformer : 1 };
var libx2RegexpClauses = [ "include", "exclude", "regexptexttransformer" ];

/**
 * Resolver 'url' relative to 'base'
 */
function resolveURL(baseURL, url)
{
    if (url.match(/^[a-z]+:/)) {    // absolute URL
        return url;
    } else
    if (url.match(/^\/.*/)) {        // same host+protocol, but absolute path
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

function handleEntry(visitor, url, cacheMissActivity) {

    function handleEntryBody(xmlDoc, baseURL, entryNode) {
        var libx2Node = libx.utils.xpath.findSingleXML(
            xmlDoc, "./libx2:*", entryNode, ns
        );

        var desc = libx.utils.xpath.findSingleXML(xmlDoc, "./atom:title/text()",
            entryNode, ns);
        desc = desc != null ? desc.nodeValue : "atom:title is missing";
        var atomid = libx.utils.xpath.findSingleXML(xmlDoc, "./atom:id/text()",
            entryNode, ns);
        atomid = atomid != null ? atomid.nodeValue : "atom:id is missing";

        if (libx2Node == null) {
            libx.log.write(baseURL + ": entry " + atomid + " does not contain any libx2:* node");
            return;
        }

        var nodeInfo = { 
            baseURL: baseURL,
            id: atomid,
            description: desc,
            entries: []
        };

        var clauses = libx2Clauses;
        for (var i = 0; i < clauses.length; i++) {
            var clause = clauses[i];
            var clauseNodes = libx.utils.xpath.findNodesXML(
                xmlDoc, "./libx2:" + clause, libx2Node, ns);

            if (clause in libx2ArrayClauses)
                nodeInfo[clause] = new Array();

            if (clauseNodes == null)
                continue;

            if (clause in libx2ArrayClauses) {
                for (var j = 0; j < clauseNodes.length; j++) {
                    nodeInfo[clause].push(String(clauseNodes[j].firstChild.nodeValue));
                }
            } else {
                if (clauseNodes.length > 0)
                    nodeInfo[clause] = String(clauseNodes[0].firstChild.nodeValue);

                if (clauseNodes.length > 1) {
                    libx.log.write("module: '" + desc + "' additional <" + clause + "> ignored");
                }
            }
        };

        // verify that 'include', 'exclude', etc. look like regular expressions
        for (var i = 0; i < libx2RegexpClauses.length; i++) {
            var rClause = libx2RegexpClauses[i];
            for (var j = 0; j < nodeInfo[rClause].length; j++) {
                try {
                    var m = nodeInfo[rClause][j].match(/\/(.*)\/(.*)/);
                    nodeInfo[rClause][j] = { regex: m[1], flag: m[2] };
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
                url: resolveURL(baseURL, String(libxEntries[i].getAttribute('src')))
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

    var cachehit = false;
    libx.cache.defaultObjectCache.get({
        url: pathDir,
        cacheprobe: function (filecontent, metadata) {
            if (metadata) {
                this.success(filecontent, metadata);
                cachehit = true;
            } else if (cacheMissActivity)
                cacheMissActivity.markReady();
        },
        success: function (filecontent, metadata) {
            if (cachehit)
                return;
            var xmlDoc = libx.utils.xml.loadXMLDocumentFromString(filecontent);
            var xpathExpr = "//atom:entry[atom:id/text() = '" + url + "']";
            var entry = libx.utils.xpath.findSingleXML(xmlDoc, xpathExpr, xmlDoc, ns);
            if (entry != null) {
                handleEntryBody(xmlDoc, pathDir, entry);
            } else {
                libx.cache.defaultObjectCache.get({
                    url: url,
                    success: function (filecontent, metadata) {
                        var xmlDoc = libx.utils.xml.loadXMLDocumentFromString(filecontent);
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
     * @param {String} rootPackageId - URL describing the entry/id 
     *         of a package or libapp.
     */
    initialize: function (rootPackageId) {
        this.rootPackage = rootPackageId;
    },

    /**
     * Apply visitor to all packages, libapps, and modules
     * that are referenced from given root.
     *
     * @see libx.libapp.PackageVisitor
     *
     * @param {libx.libapp.PackageVisitor} visitor
     * @param {Object} cacheMissActivity - activity to mark ready if the libapp
     *         is not in the object cache (optional)
     */
    walk : function (visitor, cacheMissActivity) {
        handleEntry(visitor, this.rootPackage, cacheMissActivity);
    }
});

}) ();
