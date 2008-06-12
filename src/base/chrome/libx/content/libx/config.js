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
 *                 Nathan Baker (nathanb@vt.edu)
 * 
 * ***** END LICENSE BLOCK ***** */

/*
 * LibX toolbar extension
 *
 * Author: Annette Bailey <annette.bailey@gmail.com>
 */ 


/*
 * This file contains functionality that works in all browsers
 * related to configuration, properties, and localization.
 */

/*
 * Turn an option into a more suitable type.
 * Turns (string) "true" -> (boolean) true
 *       (string) "false" -> (boolean) false
 *       (string) "" -> null
 */ 
function libxNormalizeOption(value) 
{
    if (value == "false")
        return false;
    if (value == "true")
        return true;
    if (value == "")
        return null;
    return value;
}

function libxShowObject(s, obj)
{
    for (var k in obj)
        s += k + "=" + obj[k] + " (" + typeof obj[k] + "), ";
    alert(s);
}

// Initialize options
function libxInitializeOptions()
{
    var opts = new Object();
    libxEnv.options = opts;
    var options = libxEnv.xpath.findNodesXML(libxEnv.xmlDoc.xml, "/edition/options/option");
    
    for (var i = 0; i < options.length; i++) {
        opts[options[i].getAttribute('key')] = 
            libxNormalizeOption(options[i].getAttribute('value'));
    }

    if (!opts.autolinkstyle)
        opts.autolinkstyle = "1px dotted";
}

// Initialization - this code is executed when extension is loaded
function libxInitializeProperties() 
{
    libxEnv.xmlDoc = libxGetConfigXML();

    libxInitializeOptions();
}

function libxGetConfigXML()
{
    var xmlDoc = new Object();

    try {
        
        xmlDoc.xml = libxEnv.getXMLConfig();
        xmlDoc.getNode = function (xpath) {
            return libxEnv.xpath.findSingleXML(this.xml, xpath);
        };
        xmlDoc.getAttr = function (xpath, attr) {
            var n = this.getNode(xpath);
            return n ? n.getAttribute(attr) : null;
        };
        xmlDoc.copyAttributes = function(xnode, obj) {
            for (var i = 0; i < xnode.attributes.length; i++) {
                var attr = xnode.attributes[i];
                var opt = libxNormalizeOption(attr.nodeValue);
                if (opt != null)
                    obj[attr.nodeName] = opt;
                // else preserve default.
            }
        };
    } catch (er) { }
    
    return xmlDoc;   
}


// vim: ts=4
