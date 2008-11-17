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

/*
 * LibX toolbar extension
 *
 * Author: Annette Bailey <annette.bailey@gmail.com>
 */ 

libx.config = { };

/* Wrap an XML document */
libx.config.XMLConfigWrapper = libx.core.Class.create({
    initialize: function (xmlDocument) {
        this.xml = xmlDocument;
    },
    getNode : function (xpathExpr) {
        return libxEnv.xpath.findSingleXML(this.xml, xpathExpr);
    },
    getAttr : function (xpath, attr) {
        var n = this.getNode(xpath);
        return n ? n.getAttribute(attr) : null;
    },
    // copy attributes from xnode to obj
    copyAttributes : function(xnode, obj) {
        for (var i = 0; i < xnode.attributes.length; i++) {
            var attr = xnode.attributes[i];
            var opt = libxNormalizeOption(attr.nodeValue);
            if (opt != null)
                obj[attr.nodeName] = opt;
            // else preserve default.
        }
    }
});

/* A convenience mixin that provides a 'getByName' function to
 * find items by name
 */
libx.config.NameableItemArray = {
    getByName : function ( name ) {
        for ( var i = 0; i < this.length; i++ ) {
            if ( this[i].name == name )
                return this[i];
        }
        return null;
    }
};

/*
 * This file contains functionality that works in all browsers
 * related to configuration, properties, and localization.
 */

libx.config.EditionConfigurationReader = libx.core.Class.create ( {
    initialize: function ( invofcc ) {
        var edition = new Object();
        var editionConfigReader = this;

        libxEnv.getXMLConfig({
            url: invofcc.url,
            onload: function (xhr) {
                var doc = new libx.config.XMLConfigWrapper(xhr.responseXML);

                var edition = {
                    catalogs : editionConfigReader.loadCatalogs ( doc ),
                    openurl : editionConfigReader.loadResolvers ( doc ),
                    proxy : editionConfigReader.loadProxies ( doc ),
                    options : editionConfigReader.loadOptions ( doc ),
                    links: editionConfigReader.loadLinks ( doc ),
                    name: { }
                };
                doc.copyAttributes(doc.getNode("/edition/name"), edition.name);

                // XXX to-be-fixed
                // augment searchOptions2Labels map with entries from configuration file
                editionConfigReader.makeConfigurationItemArray (doc, "Search Option",
                    "/edition/searchoptions/*", null, libx.core.EmptyFunction,
                    function (node, option) {
                        libxEnv.searchOptions2Labels[option.value] = option.label;
                        libxConfig.searchOptions[option.value] = option.label;
                    }
                );

                invofcc.onload ( edition );
            }
        });
    },
    loadLinks: function (doc) {
        return this.makeConfigurationItemArray (doc, "Link", 
            "/edition/links/*", null, libx.core.EmptyFunction,
            libx.core.EmptyFunction);
    },
    loadOptions: function (doc) {
        var opts =  {
            // default options
            autolinkstyle : "1px dotted"
        };

        var options = libxEnv.xpath.findNodesXML(doc.xml, "/edition/options/option");
        for (var i = 0; i < options.length; i++) {
            opts[options[i].getAttribute('key')] = 
                libxNormalizeOption(options[i].getAttribute('value'));
        }
        return opts;
    },
    /**
     *
     */
    makeConfigurationItemArray : function ( doc, itemType, xpathExpr, 
                                            factory, getFactoryKey, postAddFunc ) {
        var items = new Array();
        libx.core.Class.mixin(items, libx.config.NameableItemArray);

        var xmlItems = libxEnv.xpath.findNodesXML(doc.xml, xpathExpr);
        for ( var i = 0; i < xmlItems.length; i++) {
            var node = xmlItems[i];
            var item = { };

            if (factory != null) {
              var factoryKey = getFactoryKey(node);

              if (typeof (factory[factoryKey]) != "function") {
                  libxEnv.writeLog(itemType + " Type " + factoryKey + " not supported.");
                  continue;
              }

              item = new factory[factoryKey]();
            }
            doc.copyAttributes(node, item); 
            postAddFunc(node, item);
            items.push(item);
        }

        // http://support.aptana.com/asap/browse/STU-1908 claims that ECMAScript only
        // allows identifiers as properties, but 'default' is a keyword in JavaScript
        items.default = items[0];
        return items;
    },
    loadCatalogs : function ( doc ) {
        return this.makeConfigurationItemArray (doc, "Catalog", 
            "/edition/catalogs/*", libx.catalog.factory, 
            function (node) {
                return node.nodeName;
            },
            function (node, cat) {
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
            
                libxEnv.writeLog("registered " + cat.name + " (type=" + node.nodeName + ", options=" + cat.options + ")");
            });
    },
    loadResolvers : function ( doc ) {
        return this.makeConfigurationItemArray (doc, "OpenURL", 
            "/edition/openurl/*", libx.openurl.factory, 
            function (node) {
                return node.getAttribute("type");
            },
            function (node, resolver) {
                libxEnv.writeLog("registered OpenURL resolver " + resolver.name 
                    + " (type=" + node.getAttribute('type') + ")");
            });
    },
    loadProxies : function ( doc ) {
        return this.makeConfigurationItemArray (doc, "Proxy", 
            "/edition/proxy/*", libx.proxy.factory, 
            function (node) {
                return node.nodeName;
            },
            function (node, proxy) {
                proxy.type = node.nodeName;
            });
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

// vim: ts=4
