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

var libx2Clauses = [ "include", "exclude", "require", "guardedby", "body", "regexptexttransformer", "override" ];
var libx2ArrayClauses = { include : 1, exclude : 1, guardedby : 1, require : 1, regexptexttransformer : 1 };
var libx2RegexpClauses = [ "include", "exclude", "regexptexttransformer" ];
var authorInfo = ["name", "uri", "email" ];
var entryInfo = { updated: [], author: authorInfo };

/*
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
 * For onpackage and onlibapp methods: 
 *    We pass an (optional) object 
 */
libx.libapp.PackageVisitor = libx.core.Class.create(
    /** @lends libx.libapp.PackageVisitor.prototype */{
    
    onpackage: function (pkg,pkgObj) {
        for (var i = 0; i < pkg.entries.length; i++)
            handleEntry(this, pkg.entries[i].url,pkgObj);
    },
    onlibapp: function (libapp,libappObj) {
        for (var i = 0; i < libapp.entries.length; i++)
            handleEntry(this, libapp.entries[i].url,libappObj);
    },
    onmodule: function (module) {
    },
    beforeentry: function(entryUrl) {
    }
});


/**
 * This function fetches each entry at given url. 
 * @param visitor {PackageVisitor object} - visitor to pass each entries information
 * @param url {string} - location of each entry
 * @param obj {object}  - a object thats needs to passed alongwith that 
 *                                    entry to its visitor 
 * @param cacheMissActivity {object} - activity to mark ready if
 *                                                 the entry is not in the object cache
 */
function handleEntry(visitor, url, obj, cacheMissActivity) {

    if(visitor["beforeentry"]){
      var prep =  visitor["beforeentry"](url);
    }

    function handleEntryBody(xmlDoc, baseURL, entryNode) {
        var libx2Node = libx.utils.xpath.findSingleXML(
            xmlDoc, "./libx2:package|./libx2:libapp|./libx2:module", entryNode, ns
        );

        var title = libx.utils.xpath.findSingleXML(xmlDoc, "./atom:title/text()",
            entryNode,ns);
        title = title != null ? title.nodeValue : "atom:title is missing";
        var desc = libx.utils.xpath.findSingleXML(xmlDoc, "./atom:content/text()",
            entryNode, ns);
        desc = desc != null ? desc.nodeValue : "atom:content is missing";
        var atomid = libx.utils.xpath.findSingleXML(xmlDoc, "./atom:id/text()",
            entryNode, ns);
        atomid = atomid != null ? atomid.nodeValue : "atom:id is missing";

        if (libx2Node == null) {
            var err = "Entry (" + atomid + ") does not contain any libx2:* node";
            libx.log.write(err);
            visitor.error && visitor.error(err,prep,obj);
            return;
        }

        var nodeInfo = { 
            baseURL: baseURL,
            id: atomid,
            title: title,
            type: (libx2Node.localName || libx2Node.nodeName.replace("libx:","")),
            description: desc,
            entries: []
        };

        var tempNode;
        for (infoItem in entryInfo) {
           if (entryInfo[infoItem].length == 0) {
               tempNode = libx.utils.xpath.findSingleXML(xmlDoc, "./atom:"+infoItem+"/text()",
                   entryNode,ns);
               tempNode = tempNode != null ? tempNode.nodeValue : "atom:"+infoItem+" is missing";
               nodeInfo[infoItem] = tempNode;
           }
           else {
              var itemInfoArr = entryInfo[infoItem];
              nodeInfo[infoItem] = {};
              for (var item = 0; item < itemInfoArr.length; ++item) {
                tempNode = libx.utils.xpath.findSingleXML(xmlDoc, "./atom:"+infoItem+"/atom:"+itemInfoArr[item]+"/text()",
                entryNode,ns);
                tempNode = tempNode != null ? tempNode.nodeValue : "atom:"+infoItem+"//"+itemInfoArr[item]+" is missing";
                nodeInfo[infoItem][itemInfoArr[item]] = tempNode;
              };
           }  
        }

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
        var prefNodes = libx.utils.xpath.findNodesXML(
            xmlDoc, "./libx2:preferences/*", libx2Node, ns);
        if (prefNodes != null && prefNodes.length && libx.prefs[url]) {
            prefNodes.forEach(function (node) { 
                libx.preferences.loadXML(node, { base: "libx.prefs." + url });
            });
        }
            
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
        for (var i = 0; params != null && i < params.length; i++) {
            nodeInfo.params[params[i].getAttribute("name")] = {
                type: params[i].getAttribute("type"),
                desc: params[i].textContent
            };
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
            
        var visitorMethodName = "on" + String((libx2Node.localName || libx2Node.nodeName.replace("libx:","")));
        if (visitor[visitorMethodName])
            visitor[visitorMethodName](nodeInfo,prep,obj);
            
        var params = libx.utils.xpath.findNodesXML(
            xmlDoc, "./libx2:params/libx2:param", libx2Node, ns);
            
    }
    
    var pathComp = url.split(/\//);
    /* Note: the pathDir must not include a trailing slash!
     * Otherwise, we can't serve saved feeds straight from disk, as in
     * http://libx.org/libx2/libapps/libx.editions@gmail.com/core
     * To ensure resolveURL works, we re-add the trailing slash
     * below before calling handleEntryBody
     */
    var pathDir = String(url.match(/(.*)\//)[1]);
    var pathBase = url.replace(/.*\//, "");

    if (debug) libx.log.write("url= " + url + " path=" + pathDir + " base=" + pathBase);
    
    // Get the entire feed (which should include the entry for this url).
    // If a cacheMissActivity was given to the PackageWalker, our initial
    // request must check the cache only, so if it is not in the cache, we can
    // mark it ready immediately.  If there is a cache miss, we repeat the
    // request without restricting results to cached items.
    var success = false;
    var pathRequest = {
        dataType: "xml",
        url: pathDir,
        validator: libx.cache.validators.feed,
        cacheOnly: cacheMissActivity && true,
        success: function (xmlDoc, metadata) {
            success = true;
            var xpathExpr = "//atom:entry[atom:id/text() = '" + url + "']";
            var entry = libx.utils.xpath.findSingleXML(xmlDoc, xpathExpr, xmlDoc, ns);
            if (entry != null) {
                // URL entry was found in this feed
                handleEntryBody(xmlDoc, pathDir + "/", entry);
            } else {
                success = false;
                // URL entry not found in this feed; fetch the entry individually
                var urlRequest = {
                    dataType: "xml",
                    url: url,
                    validator: libx.cache.validators.feed,
                    cacheOnly: pathRequest.cacheOnly,
                    success: function (xmlDoc, metadata) {
                        success = true;
                        handleEntryBody(xmlDoc, pathDir + "/", xmlDoc.documentElement);
                    },
                    error: function (err) {
                        var err2 = "atomparser.js: Error status " + err + " when walking " + url;
                        libx.log.write(err2);
                        visitor.error && visitor.error(err2,prep,obj);
                    },
                    complete: function () {
                        if (urlRequest.cacheOnly && !success) {
                            cacheMissActivity.markReady();
                            urlRequest.cacheOnly = false;

                            // issue the same request, but don't require the item to be cached
                            libx.cache.defaultObjectCache.get(urlRequest);
                        }
                    }
                };
                libx.cache.defaultObjectCache.get(urlRequest);
            }
        },
        complete: function () {
            if (pathRequest.cacheOnly && !success) {
                cacheMissActivity.markReady();
                pathRequest.cacheOnly = false;
                libx.cache.defaultObjectCache.get(pathRequest);
            }
        },
        error: function (err) {
            var err2 = "atomparser.js: Error status " + err + " when walking " + pathDir;
            libx.log.write(err2);
            visitor.error && visitor.error(err2,prep,obj);
        }
    };


    libx.cache.defaultObjectCache.get(pathRequest);

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
     * @param {libx.libapp.PackageVisitor} visitor  visitor class
     * @param {Object} cacheMissActivity  (optional) activity to mark ready if
     *    the entry is not in the object cache
     */
    walk : function (visitor, cacheMissActivity) {
        handleEntry(visitor, this.rootPackage, null, cacheMissActivity);
    }
});

}) ();
