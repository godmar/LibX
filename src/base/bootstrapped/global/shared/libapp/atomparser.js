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
        
        // add preference attribute
        var prefNode = libx.utils.xpath.findNodesXML(
            xmlDoc, "./libx2:preferences/*", libx2Node, ns);
        if (prefNode != null)
            nodeInfo["preferences"] = prefNode[0];
            
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

        // add entries and args
        var libxEntries = libx.utils.xpath.findNodesXML(
            xmlDoc, "./libx2:entry", libx2Node, ns);
        for (var i = 0; libxEntries != null && i < libxEntries.length; i++) {
            var nodeEntry = {
                url: resolveURL(baseURL, String(libxEntries[i].getAttribute('src')))
            }
            var argNodes = libx.utils.xpath.findNodesXML(
                xmlDoc, "./libx2:args/libx2:arg", libxEntries[i], ns);
            if (argNodes != null) {
                nodeEntry.args = {};
                for ( var j = 0; j < argNodes.length; j++ ) {
                    nodeEntry.args[argNodes[j].getAttribute("name")] = {
                        value: argNodes[j].getAttribute("value"),
                        type: argNodes[j].getAttribute("type")
                    };
                }
            }
            nodeInfo.entries.push(nodeEntry);
        }
        
        // add params
        var params = libx.utils.xpath.findNodesXML(
            xmlDoc, "./libx2:params/libx2:param", libx2Node, ns);
        nodeInfo.params = {};
        if ( params != null ) {
            for (var i = 0; i < params.length; i++) {
                nodeInfo.params[params[i].getAttribute("name")] = {
                    type: params[i].getAttribute("type")
                };
            }
        }
            
        // add localizations
        var locales = libx.utils.xpath.findNodesXML(
            xmlDoc, "./libx2:locale", libx2Node, ns);
        nodeInfo.locales = {};
        if ( locales != null ) {
            for (var i = 0; i < locales.length; i++) {
                var language = locales[i].getAttribute("language");
                nodeInfo.locales[language] = locales[i].textContent;
                if (locales[i].getAttribute("default") == "true")
                    nodeInfo.defaultLocale = language;
            }
        }
            
        var visitorMethodName = "on" + String(libx2Node.localName);
        if (visitor[visitorMethodName])
            visitor[visitorMethodName](nodeInfo);
            
        var params = libx.utils.xpath.findNodesXML(
            xmlDoc, "./libx2:params/libx2:param", libx2Node, ns);
            
    }

    var pathComp = url.split(/\//);
    var pathDir = String(url.match(/.*\//));
    var pathBase = url.replace(/.*\//, "");

    if (debug) libx.log.write("url= " + url + " path=" + pathDir + " base=" + pathBase);
    
    // get the entire feed (which should include the entry for this url)
    libx.cache.defaultObjectCache.get({
        cachehit: false, // used below
        url: pathDir,
        cacheprobe: function (filecontent, metadata) {
            if (metadata) {
                this.success(filecontent, metadata);
                this.cachehit = true;
            } else if (cacheMissActivity)
                cacheMissActivity.markReady();
        },
        success: function (filecontent, metadata) {
            if (this.cachehit)
                return;
            var xmlDoc = libx.utils.xml.loadXMLDocumentFromString(filecontent);
            var xpathExpr = "//atom:entry[atom:id/text() = '" + url + "']";
            var entry = libx.utils.xpath.findSingleXML(xmlDoc, xpathExpr, xmlDoc, ns);
            if (entry != null) {
                // URL entry was found in this feed
                handleEntryBody(xmlDoc, pathDir, entry);
            } else {
                // BRN: handle this case in scheduler
                // URL entry not found in this feed; fetch the entry individually
                libx.cache.defaultObjectCache.get({
                    cachehit: false, // used below
                    url: url,
                    cacheprobe: function (filecontent, metadata) {
                        if (metadata) {
                            this.success(filecontent, metadata);
                            this.cachehit = true;
                        } else {
                            if (cacheMissActivity) {
                                cacheMissActivity.markReady();
                            }
                        }
                    },
                    success: function (filecontent, metadata) {
                        if (this.cachehit)
                            return;
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
