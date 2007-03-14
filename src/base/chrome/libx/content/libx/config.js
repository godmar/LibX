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
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * LibX toolbar extension
 *
 * Author: Annette Bailey <annette.bailey@gmail.com>
 */ 

var libx_version = "$libxversion$"; // this is constant, but 'const' is a Mozilla-specific keyword

var libxProps;                  // a string bundle in the XUL file from which we read properties

// get a property, returning null if property does not exist
function libxGetProperty(prop, args) {
	try {
		if (args) {
		    return libxProps.getFormattedString(prop, args);
		} else {
		    return libxProps.getString(prop);
		}
	} catch (e) {
	    return null;
	}
}

function libxConvertToBoolean(value) 
{
    if (value == "false")
        return false;
    if (value == "true")
        return true;
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
    var options = xpathFindNodes(libxEnv.xmlDoc.xml, "/edition/options/option");
    
    for (var i = 0; i < options.length; i++) {
        opts[options[i].getAttribute('key')] = 
            libxConvertToBoolean(options[i].getAttribute('value'));
    }

    if (!opts.autolinkstyle)
        opts.autolinkstyle = "1px dotted";
}

// Initialization - this code is executed when extension is loaded
function libxInitializeProperties() 
{
    // this function is called after the entire overlay has been built
    // we must wait until here before calling document.getElementById
    libxProps = document.getElementById("libx-string-bundle");
    libxEnv.xmlDoc = libxGetConfigXML();

    libxInitializeOptions();
}

function libxGetConfigXML()
{
    var xmlDoc = new Object();

    try {
        
        xmlDoc.xml = libxEnv.getXMLDocument();
        xmlDoc.getNode = function (xpath) {
            return xpathFindSingle(this.xml, xpath);
        };
        xmlDoc.getAttr = function (xpath, attr) {
            var n = this.getNode(xpath);
            return n ? n.getAttribute(attr) : null;
        };
        xmlDoc.copyAttributes = function(xnode, obj) {
            for (var i = 0; i < xnode.attributes.length; i++) {
                var attr = xnode.attributes[i];
                obj[attr.nodeName] = libxConvertToBoolean(attr.nodeValue);
            }
        };
    } catch (er) { }
    
    return xmlDoc;   
}


// vim: ts=4
