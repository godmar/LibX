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

if (XPathResult == null)
    var XPathResult = Components.interfaces.nsIDOMXPathResult;

// implements abstract functions in core/global/shared/libx.js
libx.utils.xpath = {
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
            libx.log.write("In findNodesXML: XPath expression " + xpathexpr + " does not return a set of nodes: " + e);
            return null;    // XXX should you rethrow here?
        }

        var rr = new Array();
        var n;
        while ((n = r.iterateNext()) != null)
            rr.push(n);

        return rr;
    }
};

// vim: ts=4
