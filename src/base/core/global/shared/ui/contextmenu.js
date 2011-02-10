
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
 *               Michael Doyle ( vtdoylem@gmail.com )
 *
 * ***** END LICENSE BLOCK ***** */
 
/**
 * Namespace for Browser abstractions
 * @namespace
 */
 
libx.ui.ContextMenu = ( function () 
{ 

/**
 *  Represents a single entry in the context menu
 *  This class represents the base class from which other
 *  items will inherit
 *  
 *  Items should implement the following functions
 *
 *  onshowing (p)
 *  - Called when this menu item is supposed to be shown
 *  - p: PoupHelper object
 *
 *  initialize (args)
 *  - Called once to initialize the object
 *  - Args are up to implementor to define
 *  
 *  Additionaly, Items should have the following properties
 *  contexts: an array of contexts for when the menu should appear
 *  onclick: function to execute upon click
 *  type: unique type attribute for all items of this class
 *  name: unique name attribute for this item
 */
var ContextMenuItem = libx.ui.ContextMenuItem = libx.core.Class.create (
/** @lends libx.ui.ContextMenu.ContextMenuItem.prototype */ 
{
    /**
     *  @private
     *  @constructs
     */
    initialize : function () { },
    
    visible : true,
    
    title : "Context Menu Item",
    
    contexts : ["all"],
    
    // used in the preferences page to update this context menu item
    prefkey: "prefkey",
    
    onclick : function (info) { },
    
    onshowing : function (info) { },
    
    match : function () { return true; }
    

} );

// Factory to store all types of Items
ContextMenuItem.factory = new Array();

/**
 *  ContextMenuItem implementation for catalog objects
 */
ContextMenuItem.factory['catalog'] = libx.core.Class.create ( 
    ContextMenuItem,
/**
 *  @lends libx.ui.ContextMenu.CatalogItem.prototype
 */ 
{
    /** @field */
    type : 'catalog',
    
    matchFuncs : {
        "i": function (info) {
            return libx.utils.stdnumsupport.isISBN(info.selectionText);
        },
        "is": function (info) {
            return libx.utils.stdnumsupport.isISSN(info.selectionText);
        },
        "doi": function (info) {
            return libx.utils.stdnumsupport.isDOI(info.selectionText);
        },
        "pmid": function (info) {
            var m = info.selectionText.match(/(PMID|PubMed\s*ID)[^\d]*(\d+)/i);
            if (m != null)
                return m[2];
            return null;
        }
    },
    
    /**
     *  @private
     *  @augments libx.ui.ContextMenu.ContextMenuItem
     *  @constructs
     *  @see libx.ui.ContextMenu.Group.createItem
     *  @param args Object containing the following fields  
     *  @param {String} args.name  Name of this item
     *  @param {String} args.searchType  Search Type for this item
     */
    initialize : function ( name, searchType ) {
        this.searcher = libx.edition.catalogs.getByName(name);
        this.searchType = searchType; 
        this.title = libx.locale.defaultStringBundle.getProperty("catalog_search_label", name,
                        libx.edition.searchoptions[searchType], '"%s"');
        this.prefkey = name + "." + searchType;
        this.visible = libx.prefs.contextmenu[name][searchType]._value;
        this.match = (function (matchFuncs) {
            if (searchType in matchFuncs)
                return matchFuncs[searchType];
            return function (info) {
                var match = true;
                for (var i in matchFuncs)
                    match = match && !matchFuncs[i](info);
                return match;
            };
        }) (this.matchFuncs);
    },

    contexts : ["selection"],

    onclick : function (info) {
        libx.ui.openSearchWindow ( 
            this.searcher.search ( 
                [{ searchType : this.searchType, searchTerms: info.selectionText }] 
            )
        );
    }

});

/**
 *  Implementation of the ContextMenuItem class for openurl objects
 *  Derived from the factory['catalog'] class
 */
ContextMenuItem.factory['openurl'] = libx.core.Class.create ( 
    ContextMenuItem.factory['catalog'],
/** @lends libx.ui.ContextMenu.OpenUrlItem.prototype */
{
    /**@field openurl*/
    type : 'openurl',
    
    /**
     *  @private
     *  @constructs
     *  @see libx.ui.ContextMenu.Group.createItem
     *  @augments libx.ui.ContextMenu.CatalogItem
     */
    initialize : function (name) {
        this.searcher = libx.edition.openurl.getByName(name);
        this.title = libx.locale.defaultStringBundle.getProperty("openurl_search_label", name, '"%s"');
        this.prefkey = name + ".enabled";
        this.visible = libx.prefs.contextmenu[name]["enabled"]._value;
    },
    
    contexts : ["selection"], //BRN: also add link
    
    onclick : function (info) {

        var options = ["i", "is", "doi", "pmid"];
        for (var i = 0; i < options.length; i++) {
            var match = this.matchFuncs[options[i]](info);
            if (match) {
                libx.ui.openSearchWindow (
                    this.searcher.makeOpenURLSearch([ { searchType: options[i], searchTerms: match } ])
                );
                return;
            }
        }
        
        // selection did not match options; do a journal title search
        libx.ui.openSearchWindow (
            this.searcher.makeOpenURLSearch([ { searchType: "jt", searchTerms: info.selectionText } ])
        );
    }
    
});
            
/**
 *  Implementation of the ContextMenuItem class for proxy objets
 */
ContextMenuItem.factory['proxy'] = libx.core.Class.create ( 
    ContextMenuItem, 
/** @lends libx.ui.ContextMenu.ProxyItem.prototype */
{
    type : 'proxy',
    searchType : 'enabled',
    /**
     *  @private
     *  @constructs
     *  @augments libx.ui.ContextMenu.ContextMenuItem
     *  @see libx.ui.ContextMenu.Group.createItem
     *  @param args Object containing fields below
     *  @param {String} args.name Name of this object
     */
    initialize : function (name) {
        this.parent ( name );
        this.proxy = libx.edition.proxy.getByName ( name );
        this.title = libx.locale.defaultStringBundle.getProperty("proxy_reload_label", this.proxy.name);
        this.prefkey = name + ".enabled";
        this.visible = libx.prefs.contextmenu[name]["enabled"]._value;
    },
    
    onclick : function (info) {
        libx.ui.openSearchWindow(this.proxy.rewriteURL(info.pageUrl), "sametab");
    },
    
    contexts : ["page"]

});

/**
 *  Implementation of the ContextMenuItem class for openurl objects
 *  Derived from the factory['catalog'] class
 */
ContextMenuItem.factory['proxy_link'] = libx.core.Class.create ( 
    ContextMenuItem.factory['proxy'], 
/** @lends libx.ui.ContextMenu.OpenUrlItem.prototype */
{
    /**@field openurl*/
    type : 'proxy',
    
    /**
     *  @private
     *  @constructs
     *  @see libx.ui.ContextMenu.Group.createItem
     *  @augments libx.ui.ContextMenu.CatalogItem
     */
    initialize : function (name) {
        this.parent(name);
        this.title = libx.locale.defaultStringBundle.getProperty("proxy_follow_label", this.proxy.name);
    },
    
    contexts : ["link"],
    
    onclick : function (info) {
        libx.ui.openSearchWindow(this.proxy.rewriteURL(info.linkUrl));
    }

});

/**
 *  Implementation of the ContextMenuItem class for scholar magic search
 */
ContextMenuItem.factory['scholar'] = libx.core.Class.create ( 
    ContextMenuItem, 
/** @lends libx.ui.ContextMenu.ScholarItem.prototype */
{
    initialize : function () {
        this.parent();
        this.title = libx.locale.defaultStringBundle.getProperty("scholarsearch_label", '"%s"');
        this.prefkey = "Google Scholar.magicsearch";
    },

    type : 'scholar',
    contexts : ["selection"],
    
    onclick : function (info) {
        libx.ui.magicSearch(info.selectionText);
    },

});

/**
 *  This class allows items to be added dynamically to the ContextMenu.
 *  Note that this item must manually be registered with the browsers
 *  event listeners
 */
return libx.core.Class.create (
/** @lends libx.ui.ContextMenu.prototype */ 
{

    /**
     *  Initializes this context menu object
     *  Takes a paramater indicating the groupLists and groups to initialize
     *  @constructs
     *  @see menuobjects.js for an example contextMenuObject
     */
    initialize : function () {
    
        this.items = [];

        // add catalog items
        for (var i = 0; i < libx.edition.catalogs.length; i++) {
            var catalog = libx.edition.catalogs[i];
            var options = catalog.options.split(";");
            for (var j = 0; j < options.length; j++)
                this.addItem(new ContextMenuItem.factory["catalog"](catalog.name, options[j]));
            if (libx.prefs.contextmenu[catalog.name].xisbn)
                this.addItem(new ContextMenuItem.factory["catalog"](catalog.name, "xisbn"));
        }
        
        // add openurl items
        for (var i = 0; i < libx.edition.openurl.length; i++) {
            var resolver = libx.edition.openurl[i];
            this.addItem(new ContextMenuItem.factory["openurl"](resolver.name));
        }
        
        // add proxy items
        for (var i = 0; i < libx.edition.proxy.length; i++) {
            var proxy = libx.edition.proxy[i];
            this.addItem(new ContextMenuItem.factory["proxy"](proxy.name));
            this.addItem(new ContextMenuItem.factory["proxy_link"](proxy.name));
        }
        
        // add magic search
        this.addItem(new ContextMenuItem.factory["scholar"]());
        
    },
    
    registerItem: function (id, item) {
        this.items.push({
            id: id,
            item: item
        });
    },
    
    lookupItemId: function (id) {
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].id == id)
                return this.items[i].item;
        }
    },
    
    addItem: libx.core.AbstractFunction("libx.ui.ContextMenu.addItem"),

    removeItem: libx.core.AbstractFunction("libx.ui.ContextMenu.removeItem"),
    
    update: libx.core.AbstractFunction("libx.ui.ContextMenu.update")
    
});

}) ();

libx.events.addListener("EditionAndLocaleLoaded", {
    onEditionAndLocaleLoaded: function () {
        libx.ui.contextMenu = new libx.ui.ContextMenu();
    }
});
