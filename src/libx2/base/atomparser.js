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

/**
 * Iterate over entries in a libx2:package or libx2:libapp
 * and invoke 'callback'
 */
function foreachEntry(baseNode, callback) {
    var contents_nodes = libx.utils.xpath.findNodesXML(
            baseNode.ownerDocument, 
            "./libx2:entry", baseNode, ns);

    for (var i = 0; i < contents_nodes.length; i++) {
        callback(contents_nodes[i].getAttribute('src'));
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
    onPackage: function (baseURL, pkg) {
        var self = this;
        foreachEntry(pkg, function (srcAttr) {
            if (debug) libx.log.write("Saw package.entry: base=" + baseURL + " src=" + srcAttr);
            handleEntry(self, baseURL + srcAttr);
        });
    },
    onLibapp: function (baseURL, libapp) {
        var self = this;
        foreachEntry(libapp, function (srcAttr) {
            if (debug) libx.log.write("Saw libapp.entry: base=" + baseURL + " src=" + srcAttr);
            handleEntry(self, baseURL + srcAttr);
        });
    },
    onModule: function (baseURL, module) {
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

        switch (String(libx2Node.localName)) {
        case "package":
            visitor.onPackage(baseURL, libx2Node);
            break;
        case "libapp":
            visitor.onLibapp(baseURL, libx2Node);
            break;
        case "module":
            visitor.onModule(baseURL, libx2Node);
            break;
        default:
            libx.log.write("entry is neither libapp, module, nor package: " + libx2Node.localName);
        }
    }

    var pathComp = url.split(/\//);
    var pathDir = url.match(/.*\//);
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
