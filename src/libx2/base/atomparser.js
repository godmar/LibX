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

function getEntry(invofcc) {
    var pathComp = invofcc.url.split(/\//);
    var pathDir = pathComp.splice(0, pathComp.length - 1).join("/") + "/";
    var pathBase = pathComp[pathComp.length - 1];

    if (debug) libx.log.write("url= " + invofcc.url + " path=" + pathDir + " base=" + pathBase);

    libx.cache.globalMemoryCache.get({
        url: pathDir,
        dataType: "xml",
        success: function (xmlDoc, status, xhr) {
            var xpathExpr = "//atom:entry[atom:id/text() = '" + invofcc.url + "']";
            var entry = libx.utils.xpath.findSingleXML(xmlDoc, xpathExpr, xmlDoc, ns);
            if (entry != null) {
                invofcc.forEntry(xmlDoc, pathDir, entry);
            } else {
                libx.cache.globalMemoryCache.get({
                    url: invofcc.url,
                    dataType: "xml",
                    success: function (xmlDoc, status, xhr) {
                        invofcc.forEntry(xmlDoc, pathDir, xmlDoc.document); // XXX pass in root
                    }
                });
            }
        }
    });
}

function foreachEntry(baseNode, callback) {
    var contents_nodes = libx.utils.xpath.findNodesXML(
            baseNode.ownerDocument, 
            "./libx2:entry", baseNode, ns);

    for (var i = 0; i < contents_nodes.length; i++) {
        callback(contents_nodes[i].getAttribute('src'));
    }
}

libx.atom = { };
libx.libapp = { };
libx.libapp.nsResolver = ns;
libx.libapp.PackageVisitor = libx.core.Class.create({
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
    getEntry({ 
        url : url,
        forEntry : function (xmlDoc, baseURL, entryNode) {
            var pkgNode = libx.utils.xpath.findSingleXML(
                xmlDoc, "./libx2:package", entryNode, ns
            );
            if (pkgNode != null) {
                visitor.onPackage(baseURL, pkgNode);
                return;
            }

            var libappNode = libx.utils.xpath.findSingleXML(
                xmlDoc, "./libx2:libapp", entryNode, ns
            );
            if (libappNode != null) {
                visitor.onLibapp(baseURL, libappNode);
                return;
            }

            var moduleNode = libx.utils.xpath.findSingleXML(
                xmlDoc, "./libx2:module", entryNode, ns
            );
            if (moduleNode != null) {
                visitor.onModule(baseURL, moduleNode);
                return;
            }
            libx.log.write("entry is neither libapp, module, nor package !??");
        }
    });
}

libx.atom.AtomParser = libx.core.Class.create({
    initialize: function (rootPackage) {
        this.rootPackage = rootPackage;
    },
    walk : function (visitor) {
        handleEntry(visitor, this.rootPackage);
    }
});

}) ();
