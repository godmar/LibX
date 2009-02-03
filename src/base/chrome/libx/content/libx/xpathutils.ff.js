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
 * @fileoverview
 * Some utilities to help with xpath expressions for Firefox
 */

libx.ff.xpath = {
    /* See http://developer.mozilla.org/en/docs/Introduction_to_using_XPath_in_JavaScript
     * and http://www.xulplanet.com/references/objref/XPathResult.html
     *
     * var xpathResult = document.evaluate(xpathExpression, 
     *                                     contextNode, 
     *                                     namespaceResolver, 
     *                                     resultType, 
     *                                     result);
     *
     * Note: namespaceResolver is required if examined XML uses namespaces.
     * namespaceResolver is an object where the namespace prefix is the key and
     * the URI is the value.  It's encapsulated in an anonymous function.
     */

    /**
     * Evaluates an XPath expression and returns a single DOM node or null
     *
     * @param {DOM Tree} doc               document (used if root is undefined)
     * @param {String}   xpathexpr         XPath expression
     * @param {DOM Tree} root              root of DOM to execute search (used
     *                                     instead of doc if defined)
     * @param {Object}   namespaceresolver Object keys are namespace prefixes,
     *                                     values are corresponding URIs
     *
     * @returns DOM node or null if not found
     *
     */
    findSingleXML : function (doc, xpathexpr, root, namespaceresolver) {
        var r;
        try {
            r = doc.evaluate(xpathexpr, root ? root : doc, 
                             function (prefix) { 
                                 return namespaceresolver[prefix]; 
                             }, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        }
        catch (e) {
            //XXX: Need to use a more specific log type
            libx.log.write("In findSingleXML: XPath expression " + xpathexpr + " does not return a node");
            return null;
        }

        //If there's no result, this is set to null
        return r.singleNodeValue;
    },

    /**
     * Evaluates an XPath expression and returns an array of DOM nodes
     *
     * @param {DOM Tree} doc               document (used if root is undefined)
     * @param {String}   xpathexpr         XPath expression
     * @param {DOM Tree} root              root of DOM to execute search (used
     *                                     instead of doc if defined)
     * @param {Object}   namespaceresolver Object keys are namespace prefixes,
     *                                     values are corresponding URIs
     *
     * @returns array of nodes, possibly empty
     */

    findNodesXML : function (doc, xpathexpr, root, namespaceresolver) {
        var r;
        try {
            r = doc.evaluate(xpathexpr, root ? root : doc, 
                             function (prefix) { 
                                 return namespaceresolver[prefix]; 
                             }, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        }
        catch (e) {
            //XXX: Need to use a more specific log type
            libx.log.write("In findNodesXML: XPath expression " + xpathexpr + " does not return a set of nodes");
            return null;    // XXX should you rethrow here?
        }

        var rr = new Array();
        var n;
        while ((n = r.iterateNext()) != null)
            rr.push(n);

        return rr;
    },

    //XXX: Should this be renamed to findSnapshotXML?

    /**
     * Evaluates an XPath expression and returns an array of DOM nodes
     *
     * @param {DOM Tree} html              document (used if root is undefined)
     * @param {String}   xpathexpr         XPath expression
     * @param {DOM Tree} root              root of DOM to execute search (used
     *                                     instead of doc if defined)
     * @param {Object}   namespaceresolver Object keys are namespace prefixes,
     *                                     values are corresponding URIs
     *
     * @returns an array of nodes
     */

    findSnapshot : function (doc, xpathexpr, root, namespaceresolver) {
        var r;
        try {
            r = doc.evaluate(xpathexpr, root?root:doc, 
                             function (prefix) { 
                                 return namespaceresolver[prefix]; 
                             }, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        }
        catch (e) {
            //XXX: Need to use a more specific log type
            libx.log.write("In findSnapshot: XPath expression " + xpathexpr + " does not return a set of nodes");
            return null;    // XXX should you rethrow here?
        }

        var rr = new Array();
        for (var i = 0; i < r.snapshotLength; i++) {
            rr.push(r.snapshotItem(i));
        }

        return rr;
    }
};

// XXX remove this eventually
libxEnv.xpath = libx.ff.xpath;

// vim: ts=4
