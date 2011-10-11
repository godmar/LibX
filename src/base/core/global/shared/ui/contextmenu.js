
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
 * Class that creates the browser's context menu items.
 * @class
 */
libx.ui.ContextMenu = (function () { 

/**
 *  Represents a single entry in the context menu
 *  This class represents the base class from which other
 *  items will inherit.
 *  @name libx.ui.ContextMenu.ContextMenuItem
 *  @class
 */
var ContextMenuItem = libx.ui.ContextMenu.ContextMenuItem = libx.core.Class.create (
    /** @lends libx.ui.ContextMenu.ContextMenuItem.prototype */ {

    initialize : function () { },
    
    /**
     * Whether this entry is shown in the context menu.
     * @type Boolean
     * @default true
     */
    visible : true,
    
    /**
     * The string that will appear in the context menu.
     * @type String
     */
    title : "Context Menu Item",
    
    /**
     * Array of contexts in which this item should be shown.
     * Supported contexts are "all", "page", "selection", and "link".
     * @see http://code.google.com/chrome/extensions/contextMenus.html#method-create
     * @default ["all"]
     */
    contexts : ["all"],
    
    /**
     * String that maps this entry to its boolean preference.
     * This is required so the entry can be enabled/disabled in the preferences UI.
     * This value can be determined by looking at the _idstr for the corresponding
     * preference in the libx.prefs.contextmenu.  The prefkey will be "libx.prefs.contextmenu.<prefkey>".
     * @type String
     * @example
     * The preference _idstr for "Get VText" is "libx.prefs.contextmenu.Get VText.enabled".
     * Therefore, the prefkey in this case would be "Get VText.enabled".
     */
    prefkey: "prefkey",
    
    /**
     * Action to perform when this context menu item is clicked.
     * @abstract
     * @param {Object} info             parameter object with context-sensitive information
     * @config {String} selectionText   the text selected on the page
     * @config {String} pageUrl         the page the item is on
     * @config {String} linkUrl         the URL of the link clicked (if applicable)
     */
    onclick : function (info) { },
    
    /**
     * Action to perform before this context menu item is displayed.
     * @abstract
     * @param {Object} info             parameter object with context-sensitive information
     * @config {String} selectionText   the text selected on the page
     * @config {String} pageUrl         the page the item is on
     * @config {String} linkUrl         the URL of the link clicked (if applicable)
     */
    onshowing : function (info) { },
    
    /**
     * Filter function that uses context-sensitive information to determine whether this item should be shown.
     * If not overridden, this function will always return true.
     * @param {Object} info             parameter object with context-sensitive information
     * @config {String} selectionText   the text selected on the page
     * @config {String} pageUrl         the page the item is on
     * @config {String} linkUrl         the URL of the link clicked (if applicable)
     * @returns {Boolean}               true if the item should be shown; false otherwise
     */
    match : function () { return true; }
    

} );

/**
 *	Used to instantiate the various context menu item types.
 *  @name libx.ui.ContextMenu.ContextMenuItem.factory
 *  @namespace
 */
ContextMenuItem.factory = {};

/**
 *  ContextMenuItem implementation for catalog objects.
 *  @name libx.ui.ContextMenu.ContextMenuItem.factory.catalog
 *  @class
 *  @augments libx.ui.ContextMenu.ContextMenuItem
 */
ContextMenuItem.factory['catalog'] = libx.core.Class.create(ContextMenuItem,
    /** @lends libx.ui.ContextMenu.ContextMenuItem.factory.catalog.prototype */ {

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
    
    initialize : function ( name, searchType ) {
        this.searcher = libx.edition.catalogs.getByName(name);
        this.searchType = searchType; 
        this.title = libx.locale.defaultStringBundle.getProperty("label_search_catalog_type_str", name,
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
 *  Implementation of the ContextMenuItem class for openurl objects.
 *  @name libx.ui.ContextMenu.ContextMenuItem.factory.openurl
 *  @class
 *  @augments libx.ui.ContextMenu.ContextMenuItem
 */
ContextMenuItem.factory['openurl'] = libx.core.Class.create(ContextMenuItem.factory['catalog'],
    /** @lends libx.ui.ContextMenu.ContextMenuItem.factory.openurl.prototype */ {

    type : 'openurl',
    
    initialize : function (name) {
        this.searcher = libx.edition.openurl.getByName(name);
        this.title = libx.locale.defaultStringBundle.getProperty("label_search_catalog_str", name, '"%s"');
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
 *  Implementation of the ContextMenuItem class for proxy objects.
 *  @name libx.ui.ContextMenu.ContextMenuItem.factory.proxy
 *  @class
 *  @augments libx.ui.ContextMenu.ContextMenuItem
 */
ContextMenuItem.factory['proxy'] = libx.core.Class.create(ContextMenuItem, 
    /** @lends libx.ui.ContextMenu.ContextMenuItem.factory.proxy.prototype */ {

    type : 'proxy',

    searchType : 'enabled',

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
 *  Implementation of the ContextMenuItem class for proxying via links.
 *  @name libx.ui.ContextMenu.ContextMenuItem.factory.proxy_link
 *  @class
 *  @augments libx.ui.ContextMenu.ContextMenuItem
 */
ContextMenuItem.factory['proxy_link'] = libx.core.Class.create(ContextMenuItem.factory['proxy'], 
    /** @lends libx.ui.ContextMenu.ContextMenuItem.factory.proxy_link.prototype */ {

    type : 'proxy',
    
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
 *  Implementation of the ContextMenuItem class for scholar magic search.
 *  @name libx.ui.ContextMenu.ContextMenuItem.factory.scholar
 *  @class
 *  @augments libx.ui.ContextMenu.ContextMenuItem
 */
ContextMenuItem.factory['scholar'] = libx.core.Class.create(ContextMenuItem, 
    /** @lends libx.ui.ContextMenu.ContextMenuItem.factory.scholar.prototype */ {

    initialize : function () {
        this.parent();
        this.title = libx.locale.defaultStringBundle.getProperty("label_search_scholar", '"%s"');
        this.prefkey = "Google Scholar.magicsearch";
    },

    type : 'scholar',

    contexts : ["selection"],
    
    onclick : function (info) {
        libx.ui.magicSearch(info.selectionText);
    },

});

return libx.core.Class.create(
    /** @lends libx.ui.ContextMenu.prototype */ {

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
    
    /**
     * Registers an ID with a context menu item.
     * Once this is done, the item can be retrieved with its ID using {@link lookupItemId}.
     * @param {Integer}  id  the ID to map the item to
     * @param {libx.ui.ContextMenu.ContextMenuItem}  item  the item to register
     */
    registerItem: function (id, item) {
        this.items.push({
            id: id,
            item: item
        });
    },
    
    /**
     * Gets a context menu item by ID.
     * @param {Integer}  id  the ID of the item to find
     * @returns {libx.ui.ContextMenu.ContextMenuItem} the item with the given ID; null if invalid ID given
     */
    lookupItemId: function (id) {
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].id == id)
                return this.items[i].item;
        }
    },
    
    /**
     * Browser-specific function that adds the context menu item to the browser UI.
     * @abstract
     * @param {libx.ui.ContextMenu.ContextMenuItem}  item  ContextMenuItem to add
     */
    addItem: libx.core.AbstractFunction("libx.ui.ContextMenu.addItem"),

    /**
     * Browser-specific function that removes the context menu item from the browser UI.
     * @abstract
     * @param {libx.ui.ContextMenu.ContextMenuItem}  item  ContextMenuItem to remove
     */
    removeItem: libx.core.AbstractFunction("libx.ui.ContextMenu.removeItem"),
    
    /**
     * Browser-specific function that update the context menu item in the browser UI.
     * @abstract
     * @param {Integer}  id  ID of item to update
     * @param {libx.ui.ContextMenu.ContextMenuItem}  params  update parameters
     * @config {Boolean}  visible  whether this item should be shown
     */
    update: libx.core.AbstractFunction("libx.ui.ContextMenu.update")
    
});

}) ();

libx.events.addListener("EditionConfigurationLoaded", {
    onEditionConfigurationLoaded: function () {
        libx.ui.contextMenu = new libx.ui.ContextMenu();
    }
});
