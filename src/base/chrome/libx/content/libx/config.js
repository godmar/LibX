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

const libx_version = "1.0.2";

var libxProps;          // a string bundle in the XUL file from which we read properties
var libxOptions;        // an object representing LibX options

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

// Initialize options
function libxInitializeOptions()
{
    libxOptions = new Object();
    libxOptions.sersolisbnfix = libxGetProperty("libx.sersolisbnfix");
    libxOptions.supportcoins = libxGetProperty("libx.supportcoins");
    libxOptions.rewritescholarpage = libxGetProperty("libx.rewritescholarpage");
    libxOptions.disablescholar = libxGetProperty("libx.disablescholar");
    libxOptions.autolink = libxGetProperty("libx.autolink");
    libxOptions.autolinkstyle = libxGetProperty("libx.autolinkstyle");
    if (!libxOptions.autolinkstyle)
        libxOptions.autolinkstyle = "1px dotted";
}

// Initialization - this code is executed when extension is loaded
function libxInitializeProperties() 
{
    // this function is called after the entire overlay has been built
    // we must wait until here before calling document.getElementById
    libxProps = document.getElementById("libx-string-bundle");
    libxInitializeOptions();
}

// vim: ts=4
