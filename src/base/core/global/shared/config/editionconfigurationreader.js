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
 * Read an edition's configuration from a config.xml file.
 * @class
 */
libx.config.EditionConfigurationReader = libx.core.Class.create ( 
    /** @lends libx.config.EditionConfigurationReader.prototype */{
    initialize: function ( invofcc ) {
        var editionConfigReader = this;

        libx.cache.defaultObjectCache.get({
            dataType : "xml",
            type     : "GET",
            url      : invofcc.url,

            success : function (xml, metadata) {
                var doc = new libx.config.XMLConfigWrapper(xml);

                var edition = {};
           		edition.openurl = editionConfigReader.loadResolvers ( doc );
                edition.catalogs = editionConfigReader.loadCatalogs ( doc, edition );
                edition.proxy = editionConfigReader.loadProxies ( doc );
                edition.options = editionConfigReader.loadOptions ( doc );
                edition.links = editionConfigReader.loadLinks ( doc );
                edition.searchoptions = editionConfigReader.loadSearchOptions ( doc );
                edition.localizationfeeds = editionConfigReader.loadLocalizationFeeds ( doc );
                edition.name = { };
                doc.copyAttributes(doc.getNode("/edition/name"), edition.name);
                doc.copyAttributes(doc.getNode("/edition"), edition);
                editionConfigReader.loadContextMenuPrefs("Google Scholar", "magicsearch",
                edition.options.magicsearchincontextmenu ? "magicsearch" : "");

                invofcc.onload ( edition );
            },

            error : function (xml, stat, xhr) {
                if (invofcc.onerror)
                    invofcc.onerror ( stat );
            }
        });
    },

    /**
     * Iterates over nodes given by an xpath Expression and turn them into
     * a NameableItemArray.
     * @param {XMLConfigWrapper} doc configuration document
     * @param {String} xpathExpr XPath expression describing nodes to be added
     * @param {Factory} factory Factory - a map of keys to constructors
     * @param {Function} getFactoryKey Function to obtain the key used for the factory from the node
     * @param {Function} postAddFunc Function called after item has been constructed 
     */
    makeConfigurationItemArray : function ( doc, xpathExpr, 
                                            factory, getFactoryKey, postAddFunc ) {
        var items = new Array();
        libx.core.Class.mixin(items, libx.config.NameableItemArray);

        var xmlItems = libx.utils.xpath.findNodesXML(doc.xml, xpathExpr);
        for ( var i = 0; i < xmlItems.length; i++) {
            var node = xmlItems[i];
            var item = { };

            if (factory != null) {
              var factoryKey = getFactoryKey(node);

              if (typeof (factory[factoryKey]) != "function") {
                  libx.log.write("Factory key " + factoryKey + " not supported.");
                  continue;
              }

              item = new factory[factoryKey]();
              item.type = factoryKey;
            }
            doc.copyAttributes(node, item); 
            postAddFunc(node, item);
            items.push(item);
        }

        items.primary = items[0];
        return items;
    },

    loadLocalizationFeeds: function (doc) {
        var localizationfeeds = {
            'package' : [], 'bootglobal' : [], 'bootwindow' : [] 
        }

        this.makeConfigurationItemArray (doc,
            "/edition/localizationfeeds/*[@type != 'legacy']", null, libx.core.EmptyFunction,
            function (node, feedorwhitelist) {
                switch (node.nodeName) {
                case "whitelist":
                    localizationfeeds.whitelist = feedorwhitelist;
                    break;
                case "feed":
                    localizationfeeds[feedorwhitelist.type].push(feedorwhitelist);
                    break;
                }
            });
        
        if (!localizationfeeds.package.length)
            localizationfeeds.package.push({ url: "$defaultpkgURL$" });
            
        return localizationfeeds;
    },

    loadSearchOptions: function (doc) {
        // default map of search options to search labels
        // newer configuration files store all labels in /edition/searchoptions 
        // i18n
        var searchoptions = {
            "Y" : "Keyword",
            "t" : "Title",
            "jt" : "Journal Title",
            "at" : "Article Title",
            "a" : "Author",
            "d" : "Subject",
            "m" : "Genre",
            "i" : "ISBN/ISSN",
            "c" : "Call Number",
            "j" : "Dewey Call Number",
            "doi" : "DOI",
            "pmid" : "PubMed ID",
            "xisbn" : "xISBN",
            "magicsearch" : "Magic Search"
        };

        this.makeConfigurationItemArray (doc,
            "/edition/searchoptions/*", null, libx.core.EmptyFunction,
            function (node, option) {
                searchoptions[option.value] = option.label;
            }
        );
        return searchoptions;
    },

    loadLinks: function (doc) {
        return this.makeConfigurationItemArray (doc,
            "/edition/links/*", null, libx.core.EmptyFunction,
            libx.core.EmptyFunction);
    },

    loadOptions: function (doc) {
        var opts =  {
            // default options
            autolinkstyle : "1px dotted"
        };

        var options = libx.utils.xpath.findNodesXML(doc.xml, "/edition/options/option");
        for (var i = 0; i < options.length; i++) {
            opts[options[i].getAttribute('key')] = 
                libx.utils.types.normalize(options[i].getAttribute('value'));
        }
        return opts;
    },

    loadCatalogs : function ( doc, edition ) {
        var self = this;
        return this.makeConfigurationItemArray (doc,
            "/edition/catalogs/*", libx.catalog.factory, 
            function (node) {
                return node.nodeName;
            },
            /* add xISBN-related attributes post construction */
            function (node, cat) {
                var xisbnNode = libx.utils.xpath.findSingleXML ( doc.xml, "xisbn", node );
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
                    
                    if (node.nodeName != "bookmarklet") {
                        self.loadContextMenuPrefs(cat.name, "xisbn", 
                            cat.xisbn.includeincontextmenu ? "xisbn" : "");
                    }
                    
                }
                        
                cat.urlregexp = new RegExp( cat.urlregexp );
                if (typeof (cat.__init) == "function") {
                    cat.__init(edition);
                }
            
                self.loadContextMenuPrefs(cat.name, cat.options, cat.contextmenuoptions);
                libx.log.write("registered " + cat.name + " (type=" + node.nodeName + ", options=" + cat.options + ")");
            });
    },

    loadResolvers : function ( doc ) {
        var self = this;
        return this.makeConfigurationItemArray (doc,
            "/edition/openurl/*", libx.openurl.factory, 
            function (node) {
                return node.getAttribute("type");
            },
            function (node, resolver) {
                var cmoptions = resolver.includeincontextmenu ? "enabled" : "";
                self.loadContextMenuPrefs(resolver.name, "enabled", cmoptions);
                libx.log.write("registered OpenURL resolver " + resolver.name 
                    + " (type=" + node.getAttribute('type') + ")");
            });
    },

    loadProxies : function ( doc ) {
        var self = this;
        return this.makeConfigurationItemArray (doc,
            "/edition/proxy/*", libx.proxy.factory, 
            function (node) {
                return node.nodeName;
            },
            function (node, proxy) {
                var cmoptions = proxy.includeincontextmenu ? "enabled" : "";
                self.loadContextMenuPrefs(proxy.name, "enabled", cmoptions);
                proxy.type = node.nodeName;
            });
    },
    
    loadContextMenuPrefs : function ( name, options, cmoptions ) {
        var cat = libx.prefs.contextmenu._addCategory({
            _name: name,
            _layout: "tree"
        });
        options = options.split(";");
        if (cmoptions)
            cmoptions = cmoptions.split(";");
        else
            cmoptions = [];
        for (var i = 0; i < options.length; i++) {
            var option = options[i];
            var enabled = false;
            for (var j = 0; j < cmoptions.length; j++)
                if (cmoptions[j] == option)
                    enabled = true;
            cat._addPreference({
                _name: option,
                _type: "boolean",
                _value: enabled
            });
        }
    },
    
} );
