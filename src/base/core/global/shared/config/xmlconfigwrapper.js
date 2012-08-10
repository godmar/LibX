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
 *                 Mike Doyle (vtdoylem@gmail.com)
 *                 Nathan Baker (nathanb@vt.edu)
 * 
 * ***** END LICENSE BLOCK ***** */

/**
 * Wrap an XML document containing a configuration XML document
 * and provide support for extracting attributes and copying them
 * into JS objects from it.
 *
 * @class
 */
libx.config.XMLConfigWrapper = libx.core.Class.create(
    /** @lends libx.config.XMLConfigWrapper */{
    initialize: function (xmlDocument) {
        this.xml = xmlDocument;
    },
    getNode : function (xpathExpr) {
        return libx.utils.xpath.findSingleXML(this.xml, xpathExpr);
    },
    getAttr : function (xpath, attr) {
        var n = this.getNode(xpath);
        return n ? n.getAttribute(attr) : null;
    },
    // copy attributes from xnode to obj
    copyAttributes : function(xnode, obj) {
        for (var i = 0; i < xnode.attributes.length; i++) {
            var attr = xnode.attributes.item(i);
            var opt = libx.utils.types.normalize(attr.value);
            if (opt != null)
                obj[attr.nodeName] = opt;
            // else preserve default.
        }
    }
});
