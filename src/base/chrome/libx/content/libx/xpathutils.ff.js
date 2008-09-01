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
 * The Initial Developer of the Original Code is Godmar Back (godmar@gmail.com)
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer and Virginia Tech. All Rights Reserved.
 *
 * Contributor(s): 
 * Nathan Baker (nathanb@vt.edu)
 * ***** END LICENSE BLOCK ***** */
/*
 * Some utilities to help with xpath expressions
 */

// assert libxEnv has already been created.
libxEnv.xpath = new Object();

// See http://developer.mozilla.org/en/docs/Introduction_to_using_XPath_in_JavaScript
// and http://www.xulplanet.com/references/objref/XPathResult.html
//
// var xpathResult = document.evaluate(xpathExpression, contextNode, namespaceResolver, resultType, result);
//
// Note: namespaceResolver is required if examined XML uses namespaces.
// namespaceResolver is a function that returns a name space based on a prefix.

libxEnv.xpath.findSingleXML = function (doc, xpathexpr, root, namespaceresolver) {
    return libxEnv.xpath.findSingle(doc, xpathexpr, root, namespaceresolver);
}

libxEnv.xpath.findSingle = function (doc, xpathexpr, root, namespaceresolver) {

    var r = doc.evaluate(xpathexpr, root?root:doc, 
            function (prefix) { return namespaceresolver[prefix]; }, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    if (r) return r.singleNodeValue;
    return null;
}

libxEnv.xpath.findNodesXML = function (doc, xpathexpr, root, namespaceresolver) {
    return libxEnv.xpath.findNodes(doc, xpathexpr, root, namespaceresolver);
}

libxEnv.xpath.findNodes = function (doc, xpathexpr, root, namespaceresolver) {
    var r = doc.evaluate(xpathexpr, root?root:doc, function (prefix) { return namespaceresolver[prefix]; }, XPathResult.ANY_TYPE, null);
    if (r == null) return null;

    switch (r.resultType) {
    case XPathResult.BOOLEAN_TYPE:
        return r.booleanValue;
    case XPathResult.STRING_TYPE:
        return r.stringValue;
    case XPathResult.NUMBER_TYPE:
        return r.numberValue;
    case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
        var rr = new Array();
        var n;
        while ((n = r.iterateNext()) != null)
            rr.push(n);
        return rr;
    default:
        libxEnv.writeLog("unknown resultType: " + r.resultType, libxEnv.logTypes.xpath);
        return null;
    }
}

libxEnv.xpath.findSnapshot = function (doc, xpathexpr, root) {
    var r = doc.evaluate(xpathexpr, root?root:doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if (r == null) return null;

    var rr = new Array();
    for (var i = 0; i < r.snapshotLength; i++) {
        rr.push(r.snapshotItem(i));
    }
    return rr;
}

// vim: ts=4
