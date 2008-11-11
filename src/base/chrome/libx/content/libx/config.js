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

libx.config = { };
/*
 * This file contains functionality that works in all browsers
 * related to configuration, properties, and localization.
 */

libx.config.EditionConfigurationReader = libx.core.Class.create ( {
	initialize: function ( invofcc ) {
		var edition = new Object();
		var doc = edition.doc = libxGetConfigXML();
			
			edition.catalogs = this.loadCatalogs ( doc );
		edition.openurl = this.loadResolvers ( doc );
		edition.proxy = this.loadProxies ( doc );
			
			// add getByName function: 
			edition.catalogs.getByName = edition.openurl.getByName = edition.proxy.getByName =
				function ( name ) {
					for ( var i = 0; i < this.length; i++ ) {
						if ( this[i].name == name )
							return this[i];
					}
					return null;
				};
			
			// define the defaults
			edition.catalogs.default = edition.catalogs[0];
			edition.openurl.default = edition.openurl[0];
			edition.proxy.default = edition.proxy[0];
			
			invofcc.onload ( edition );
	},
	loadCatalogs : function ( doc ) {
	    var catalogs = new Array(); 
	    var xmlCatalogs = libxEnv.xpath.findNodesXML(
							doc.xml, '/edition/catalogs/*')
	
	    var addcatno;
	    for ( addcatno = 0; 
	         (addcatno < xmlCatalogs.length ); 
	         addcatno++)
	    {
	    	var cat = null;
		    var node = xmlCatalogs[addcatno];
		    switch (node.nodeName) {
		    default:
		        if (libx.catalog.factory[node.nodeName] !== undefined) {
		            cat = new libx.catalog.factory[node.nodeName]();
		            break;
		        }
				libxEnv.writeLog("Catalog type " + node.nodeName + " not supported.");
		        /* FALL THROUGH */
		    case null:
		    case "":
		        break;
		    }
		    
		    doc.copyAttributes( node, cat ); 
		        
		    var xisbnNode = libxEnv.xpath.findSingleXML ( doc.xml, "xisbn", node );
		    if ( xisbnNode ) {
		        /* Most catalogs will inherit the xisbn property from their prototype,
		         * but since the xisbn settings can be overridden on a per catalog basis,
		         * each catalog must have its own xisbn object.
		         * Otherwise, the prototyped object would be aliased and changes propagated.
		         * Therefore, we clone the inherited xisbn object, then override the
		         * inherited xisbn property.
		         */
		        var xisbnCopy = new Object();
		        for (var k in cat.xisbn) {
		            xisbnCopy[k] = cat.xisbn[k];
		        }
		        cat.xisbn = xisbnCopy;
		
		        doc.copyAttributes ( xisbnNode, cat.xisbn );
		    }
		        	
		    cat.urlregexp = new RegExp( cat.urlregexp );
		    if (typeof (cat.__init) == "function") {
		        cat.__init();
		    }
		
		    libxEnv.writeLog("xml registered " + cat.name + " (type=" + node.nodeName + ", options=" + cat.options + ")");
		    catalogs.push(cat);
	    }
		return catalogs;
	},
	loadResolvers : function ( doc ) {
		var resolvers = new Array();
		var resolverNodes = libxEnv.xpath.findNodesXML(
			doc.xml, '/edition/openurl/*');
	    
	    for ( var i = 0; i < resolverNodes.length; i++ ) {
	        var pnode = resolverNodes[i];
	        var ourltype = pnode ? pnode.getAttribute("type") : null;
	        var resolver = null;
	        if (typeof (libx.openurl.factory[ourltype]) == "function") {
	            resolver = new libx.openurl.factory[ourltype]();
	        } else {
	            libxEnv.writeLog("Unsupported OpenURL type: " + ourltype);
	            resolver = null;
	            return;
	        }
	        
	        libxEnv.xmlDoc.copyAttributes(pnode, resolver);
	        resolvers.push(resolver);
	    }
	    return resolvers;
	},
	loadProxies : function ( doc ) {
		var proxies = new Array();
		var proxyNodes = libxEnv.xpath.findNodesXML(
			doc.xml, '/edition/proxy/*');
	    for ( var i = 0; i < proxyNodes.length; i++ ) {
	    	var pnode = proxyNodes[i];
	        var proxytype = pnode.nodeName;
	        var proxy;
	        if (typeof (libx.proxy.factory[proxytype]) == "function") {
	            proxy = new libx.proxy.factory[proxytype]();
	        } else {
	    	    libxEnv.writeLog("Unsupported proxy.type=" + proxytype);
	            proxy = null;
	        }
	        if ( proxy != null ) {
	            proxy.type = proxytype;
	            libxEnv.xmlDoc.copyAttributes( pnode, proxy );
	            proxies.push ( proxy );
	        }
	    }
	    return proxies;
	}
} );
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

function libxGetConfigXML(url)
{
    var xmlDoc = new Object();

    try {
        
        xmlDoc.xml = libxEnv.getXMLConfig(url);
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
