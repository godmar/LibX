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
 *                 Michael Doyle ( vtdoylem@gmail.com )
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * LibX toolbar extension
 *
 * Author: Annette Bailey <annette.bailey@gmail.com>
 */ 
 
 /*
  * @fileoverview Firefox-specific code for the Libx extension
  */
 
/**
 * Firefox-specific functionality
 * @namespace
 */
libx.ff = { };

/**
 * Browser-dependent layer.
 * libx.bd is an alias for libx.ff or libx.ie.
 *
 * @see libx.ie 
 * @see libx.ff
 * @namespace
 */
libx.bd = libx.ff;

/**
 * @namespace
 * Utility classes and functions for LibX Firefox
 */
libx.ff.utils = { };

/**
 * Support for context menu.  
 * @class
 *
 * Requires
 *  chrome://global/content/nsDragAndDrop.js
 *  chrome://global/content/nsTransferable.js
 */
libx.ff.utils.ContextPopupHelper = libx.core.Class.create(
    /** @lends libx.ff.utils.ContextPopupHelper.prototype */{
    /**
     * Determine if popup was opened over element of kind 'tagname'
     * @return true if so
     */
    isTag: function(/** String */ tagname) {
        // see if current node is a descendant of a node of given type
        var p = this.lastPopupNode = document.popupNode;
        while (p && p.tagName != tagname) {
            p = p.parentNode;
        }
        if (!p)
            return false;
        this.lastPopupNode = p;
        return true;
    },

    /**
     * @return true if popup was opened over hyperlink? 
     */
    isOverLink: function() {
		// must be over A tag and have a good href (not a name)
        return this.isTag('A') && this.lastPopupNode.href != "";
    },

    /**
     * @return {String} selection, if any, else null
     */
    getSelection: function() {
        // alternatively, we could use gContextMenu.searchSelected(charlen as int)
        var focusedWindow = document.commandDispatcher.focusedWindow;
        var s = focusedWindow.getSelection();
        return s == null ? "" : s.toString();
    },

    /**
     * Determine is user selectec text
     * @return {Boolean} true if text is selected
     */
    isTextSelected: function() {
        return gContextMenu.isTextSelected;
    },

    /**
     * Get DOM node over which popup was opened
     * @return {DOMNode} over which popup was opened
     */
    getNode: function() {
        return this.lastPopupNode;
    }
});

/**
 * Support for drag'n'drop
 * @class
 *
 * Requires
 *  chrome://global/content/nsDragAndDrop.js
 *  chrome://global/content/nsTransferable.js
 */
libx.ff.utils.TextDropTarget = libx.core.Class.create(
    /** @lends libx.ff.utils.TextDropTarget.prototype */{
    initialize: function (func) {
        this.callback = func;
    },
    onDrop: function (evt,dropdata,session) {
        var d = dropdata.data;
        if (d != "") {
            d = d.replace(/\s+/g, " ");
            // d = d.replace(/[^\040-\177]/g, "");
            this.callback(d);
        } 
    },
    onDragOver: function (evt,flavour,session){},
    getSupportedFlavours : function () {
        var flavours = new FlavourSet();
        flavours.appendFlavour("text/unicode");
        return flavours;
    },
    attachToElement: function (el) {
        var self = this;
        el.addEventListener("dragdrop", function(e) { nsDragAndDrop.drop(e, self); }, false);
        el.addEventListener("dragover", function(e) { nsDragAndDrop.dragOver(e, self); }, false);
    }
});

/**
 * Firefox toolbar instance
 *
 * libx.ff.toolbar is a singleton
 */
libx.ff.toolbar = {
    initialize: function (toolbarname) {
        this.toolbarname = toolbarname;
        this.xulToolbar = document.getElementById(this.toolbarname);
        this.searchFieldVbox = document.getElementById("libx-search-field-vbox");

        /* reflect visibility of toolbar in checkbox when lower-right menu is shown. */
        menu = document.getElementById ( 'libx-statusbar-popup' );
        menu.addEventListener('popupshowing', function () {
            var mitem = document.getElementById('libx-statusbar-togglebar-item');
            mitem.setAttribute('checked', !this.xulToolbar.collapsed);
        }, false);
    },
    /** 
     * Invoked when hotkey for visibility is pressed. 
     * Returns true if toolbar is not collapsed.
     */
    toggle : function () {
        /*
         * We must use 'collapsed' here instead of 'hidden' since collapsed is persistent and 
         * since the toolbox's View menu as well as View -> Toolbar use collapsed.
         */
        this.xulToolbar.collapsed = !this.xulToolbar.collapsed;

        // persist, see chrome://browser/content/browser.js
        this.xulToolbar.ownerDocument.persist(this.xulToolbar.id, "collapsed");
        var ff = this;

        if (!this.xulToolbar.collapsed) {
            setTimeout ( function () { 
                ff.searchFieldVbox.childNodes.item(0).firstChild.nextSibling.firstChild.focus(); 
            }, 100);
        }
        return !this.xulToolbar.collapsed;
    },
    /** switch the current search type (addison, openurl, etc.) */
    selectCatalog : function (mitem, event) {
        event.stopPropagation();

        var sb = document.getElementById("libx-search-button");
        sb.label = mitem.label;
        this.selectedCatalog = libx.edition.catalogs[mitem.value];
        libx.utils.browserprefs.setIntPref("libx.selectedcatalognumber", mitem.value);

        this.activateCatalogOptions(this.selectedCatalog);
    },
    /**
     * The user presses the search button, 
     * perform a search in the catalog which the user previously selected
     */
    doSearch : function(event) {
        // for all catalogs transfer search field contents into 'fields' array
        var fields = new Array();
        for (var i = 0; i < this.searchFieldVbox.childNodes.length; i++) {// iterate over all search fields
            var f = this.searchFieldVbox.childNodes.item(i);
            if (f.firstChild.value == null) f.firstChild.value = "Y";
            //alert(f.firstChild.value + " " + f.firstChild.label + " " + f.firstChild.nextSibling.firstChild.value);
            var field = {
                searchType: f.firstChild.value, 
                searchTerms: f.firstChild.nextSibling.firstChild.value.replace(/^\s+|\s+$/g, '')
            };
            if (field.searchTerms == "")
                continue;

            fields.push(field);
        }

        if (!this.selectedCatalog.search)
            alert("Internal error, invalid catalog object: " + this.selectedCatalog);

        var url = this.selectedCatalog.search(fields);
        libx.ui.openSearchWindow(url);
    },
    /**
     * adjust drop-down menus based on catalog.options
     */
    activateCatalogOptions : function (catalog, alwaysreset) {
        var opt = catalog.options.split(/;/);
        // for each open search field
        for (var i = 0; i < this.searchFieldVbox.childNodes.length; i++) {
            var f = this.searchFieldVbox.childNodes.item(i);
            var tbb = f.firstChild;
            var uservalue = f.firstChild.nextSibling.firstChild.value;
            var oldvalue = tbb.value;   // try to retain old selection
            var newvalue = null;
            var mpp = tbb.firstChild;
            // clear out the old ones
            while (mpp.childNodes.length > 0)
                mpp.removeChild(mpp.firstChild);

            // create new ones
            for (var j = 0; j < opt.length; j++) {
                var option = opt[j];

                var mitem = document.createElement("menuitem");
                mitem.value = option;
                mitem.label = libx.edition.searchoptions[option];
                mitem.setAttribute('value', mitem.value );
                mitem.setAttribute('label', mitem.label );
                mitem.setAttribute('oncommand', 'libx.ff.toolbar.setFieldType(this);');
        
                if (oldvalue == mitem.value)
                    newvalue = mitem;
                mpp.appendChild(mitem);
            }
            if (newvalue == null || alwaysreset || uservalue == "")
                this.setFieldType(mpp.firstChild);   // pick first entry the default
            else
                this.setFieldType(newvalue);         // recreate prior selection
        }
    },

    /** 
     * Add search field.
     * we do this by cloning or removing the last search field child
     * the blue "add-field" button, child #2, is disabled for all children except the last
     * the red "close-field" button, child #3, is enabled for all children except the first
     * these function all depend intimately on the XUL used for the vbox/hbox search field stuff
     */
    addSearchField : function () {
        var lastSearchField = this.searchFieldVbox.lastChild;// get bottom search field
        var newSearchField = lastSearchField.cloneNode(true);// clone last search field and all its descendants
        // cloneNode, for reasons we don't understand, does not clone certain properties, such as "value"
        newSearchField.firstChild.value = lastSearchField.firstChild.value;
        // disable blue "add-field" button in what will be the next-to-last searchfield
        lastSearchField.childNodes.item(2).setAttribute("disabled", true);
        if (this.searchFieldVbox.childNodes.length == 1) {
            // show close button in first search field
            lastSearchField.childNodes.item(3).setAttribute("disabled", false); 
            // if so, the second field must have the close button enabled
            newSearchField.childNodes.item(3).setAttribute("disabled", false); 
        }

        // use setAttribute instead of setting property directly to avoid
        // https://bugzilla.mozilla.org/show_bug.cgi?id=433544
        newSearchField.firstChild.nextSibling.firstChild.setAttribute("value", "");
        this.searchFieldVbox.appendChild(newSearchField);

        // provide the next option from the list as a default
        var lastSelection = lastSearchField.firstChild.value;
        var ddMenu = newSearchField.firstChild.firstChild;
        for (var i = 0; i < ddMenu.childNodes.length - 1; i++) {
            if (ddMenu.childNodes.item(i).value == lastSelection) {
                this.setFieldType(ddMenu.childNodes.item(i+1));
                break;
            }
        }
        // return reference to new textbox so caller can move focus there
        return newSearchField.firstChild.nextSibling.firstChild;
    },

    /** 
     * remove a specific search field
     * expects hbox of search field to be removed
     */
    removeSearchField : function (/** Hbox */fieldHbox) {
        this.searchFieldVbox.removeChild(fieldHbox);
        var lastSearchField = this.searchFieldVbox.lastChild;// get bottom search field
        lastSearchField.childNodes.item(2).setAttribute("disabled", false);// enable blue "add-field" button
        if (this.searchFieldVbox.childNodes.length == 1) { // disable close button if only one search field 
            lastSearchField.childNodes.item(3).setAttribute("disabled", true);
        }
    },

    /**
     * Set a new search type 
     */
    setFieldType : function (menuitem) {
        //propagate label and value of menuitem to grandparent (toolbarbutton)
        menuitem.parentNode.parentNode.label = menuitem.getAttribute("label");
        menuitem.parentNode.parentNode.value = menuitem.getAttribute("value");
    },

    /**
     * Clear all input fields and reset toolbar to just 1 entry
     */
    clearAllFields : function () {
        // while there are more than one search field left, remove the last one
        while (this.searchFieldVbox.childNodes.length > 1) {
            this.removeSearchField(this.searchFieldVbox.lastChild);
        }
        // finally, clear the content of the only remaining one
        this.searchFieldVbox.firstChild.firstChild.nextSibling.firstChild.value = "";

        // set options back to default for currently selected catalog
        this.activateCatalogOptions(this.selectedCatalog, true);
    },

    /**
     * Activate a new configuration.
     */
    activateConfiguration: function (edition) { 
        // initialize menu at top left of toolbar
        var libxmenu = document.getElementById("libxmenu");
        var libxmenusep = document.getElementById("libxmenu-separator");
        
        // clear out existing menu entries until separator is first child
        while (libxmenu.firstChild != libxmenusep)
            libxmenu.removeChild(libxmenu.firstChild);

        for (var i = 0; i < edition.links.length; i++ )
        {
            var link = edition.links[i];
            var mitem = document.createElement("menuitem");
            mitem.setAttribute ( "label", link.label );
            if (link.href != null)
                mitem.setAttribute("oncommand", "libx.ui.openSearchWindow('" + link.href + "');");
            libxmenu.insertBefore(mitem, libxmenusep);
        }

        var scholarbutton = document.getElementById("libx-magic-button");
        
        if (edition.options.disablescholar) {
            scholarbutton.hidden = true;
        } else {
            new libx.ff.utils.TextDropTarget(libx.ui.magicSearch).attachToElement(scholarbutton);
        }

        // add the selected search as a default target
        var searchbutton = document.getElementById("libx-search-button");
        new libx.ff.utils.TextDropTarget(function (data) {
            var url = libx.ff.toolbar.selectedCatalog.search([{ searchType: 'Y', searchTerms: data }]);
            libx.ui.openSearchWindow(url);
        }).attachToElement(searchbutton);

        /*
         * Adjust styles to achieve aligned layouts.
         */
        if (navigator.userAgent.match(/.*Macintosh.*Firefox\/2/)) {
            searchbutton.style.marginTop = "-2px";
            document.getElementById("libx-menu-toolbarbutton").style.marginTop = "2px";
            document.styleSheets[0].insertRule('.libx-textbox { padding-top: 3px; padding-bottom: -1px; }',0);
            document.styleSheets[0].insertRule('.libx-toolbarbutton-with-menu { margin-top: 1px; }',0);
        }

        if (navigator.userAgent.match(/.*Macintosh.*Firefox\/3/)) {
            searchbutton.style.marginTop = "-1px";
            document.getElementById("libx-menu-toolbarbutton").style.marginTop = "2px";
        }

        document.getElementById("libx-menu-toolbarbutton")
            .setAttribute("tooltiptext", "LibX - " + edition.name.edition);

        var catdropdown = document.getElementById("libxcatalogs");
        while (catdropdown.hasChildNodes())
            catdropdown.removeChild(catdropdown.firstChild);
        
        for ( var i = 0; i < libx.edition.catalogs.length; i++ ) {
            var cat = libx.edition.catalogs[i];
            var newbutton = document.createElement("menuitem");
            newbutton.setAttribute("oncommand", "libx.ff.toolbar.selectCatalog(this,event);");
            newbutton.setAttribute("value", i );
            newbutton.setAttribute("label", "Search " + cat.name + " " );
            catdropdown.appendChild(newbutton);
        }
        
        // record initially selected catalog and activate its search options
        var selectedCatalog = libx.utils.browserprefs.getIntPref("libx.selectedcatalognumber", 0);
        // previously selected catalog may no longer be in list; choose #0 in this case
        if (selectedCatalog >= edition.catalogs.length)
            selectedCatalog = 0;    

        this.selectedCatalog = edition.catalogs[selectedCatalog];
        this.activateCatalogOptions(this.selectedCatalog);
        // copy initial label to toolbarbutton parent from menuitem first child
        catdropdown.parentNode.setAttribute("label", catdropdown.childNodes.item(selectedCatalog).getAttribute("label"));

        var autolinkcbox = document.getElementById("libx-autolink-checkbox");
        if (edition.options.autolink) {
            autolinkcbox.setAttribute('checked', libx.utils.browserprefs.getBoolPref("libx.autolink", true));
            autolinkcbox.setAttribute('oncommand', "libx.ff.toolbar.setAutolinkPreference(this.getAttribute('checked') == 'true');");
            autolinkcbox.setAttribute('hidden', false);
        } else {
            autolinkcbox.setAttribute('hidden', true);
        }
    },

    setAutolinkPreference : function (value)
    {
        libx.utils.browserprefs.setBoolPref("libx.autolink", value);
    }
};

/**
 * Initialize Firefox-specific parts.
 */
libx.ff.initialize = function() {

    libx.ff.toolbar.initialize('libx-toolbar');

    // bottom-right status bar menu
    var menu = document.getElementById ( 'libxmenu' );
    menu.addEventListener ( 'popupshowing', 
        function () {
            var m = document.getElementById ( 'libx-autolink-checkbox' );
            m.setAttribute('checked', libx.utils.browserprefs.getBoolPref("libx.autolink", true));
        }, false );

    if ( libx.utils.browserprefs.getBoolPref ( 'libx.firstrun', true ) ) {
        // i18n
        window.openDialog ( "chrome://libx/content/firstrun.xul",
                        "LibX Initial Configuration", 
                        "centerscreen, chrome, modal, resizable",
                        {
                            toolbar: toolbar.xulToolbar
                        });
        libx.utils.browserprefs.setBoolPref ( 'libx.firstrun', false );
    }

    // fire LibX 'onContentChange' event for various FF-events related to tabs
    var tabHandlers = [
        { target: gBrowser.tabContainer, event: "TabOpen"},
        { target: gBrowser.tabContainer, event: "TabSelect"},
        { target: document.getElementById("appcontent"), event: "pageshow" },
    ];
    for (var i = 0; i < tabHandlers.length; i++) {
        var h = tabHandlers[i];
        h.target.addEventListener(h.event, function (nativeEvent) {
            var ev = new libx.events.Event("ContentChange", window);
            ev.notify(nativeEvent);
        }, false);
    }

    var ac = document.getElementById("appcontent");
    ac.addEventListener("DOMContentLoaded", function (nativeFFEvent) {
        // examine event and decide whether to fire ContentLoaded
        var ev = nativeFFEvent;

        if (!ev || !ev.originalTarget || !ev.originalTarget.location) return;
        
        var win = ev.explicitOriginalTarget.defaultView;
        if (!win)
            return;     

        if (/^(javascript:|about:blank)/.test(ev.originalTarget.location))
            return;     

        // don't run anything in hidden frames - some are used for Comet-style communication
        // they examine 'textContent' on the entire document; any change will lead to
        // application failure
        if ( win.frameElement != null && win.frameElement.style.visibility == "hidden" ) 
			return;

        // wrap information in ContentLoaded Event and fire it
        var libxEvent = new libx.events.Event("ContentLoaded", window);
        libx.core.Class.mixin(libxEvent, {
            url : ev.originalTarget.location.href,
            window : win,
            nativeEvent : nativeFFEvent
        }, true);
        libxEvent.notify();
    }, true);
}

/**
 * Activate a new configuration
 */
libx.ff.activateConfiguration = function (edition) {
    this.toolbar.activateConfiguration(edition);
}

// open search results, according to user preferences
libx.ui.openSearchWindow = function (url, pref) {
    /* 
     * Posting. Follows http://developer.mozilla.org/en/docs/Code_snippets:Post_data_to_window
     */
    function convertPostString2PostData (dataString) {
        // POST method requests must wrap the encoded text in a MIME stream
        const Cc = Components.classes;
        const Ci = Components.interfaces;
        var stringStream = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
        if ("data" in stringStream) // Gecko 1.9 or newer
            stringStream.data = dataString;
        else // 1.8 or older
            stringStream.setData(dataString, dataString.length);

        var postData = Cc["@mozilla.org/network/mime-input-stream;1"].createInstance(Ci.nsIMIMEInputStream);
        postData.addHeader("Content-Type", "application/x-www-form-urlencoded");
        postData.addContentLength = true;
        postData.setData(stringStream);
        return postData;
    }

    var what = pref ? pref : libx.prefs.browser.displaypref._value;

    var isGet = typeof (url) == "string";
    var url2 = isGet ? url : url[0];

    if (isGet) {
        var tabarguments = [ url2 ];
        var windowarguments = [ url2 ];
    } else {
        var postData = convertPostString2PostData(url[1]);
        var tabarguments = [ url2, null, null, postData ];
        var windowarguments = [ url2, null, postData ];
    }
    switch (what) {
    case "newwindow":
        if (isGet) {
            window.open(url);
        } else {
            /* The only way I could figure out is to open a new browser window, attach an 
             * onload event listener, than call loadURI.
             * This is in contradiction to:
             *   http://developer.mozilla.org/en/docs/Code_snippets:Post_data_to_window
             */
            var v = window.openDialog('chrome://browser/content', '_blank', 'all,dialog=no');
            v.addEventListener("load", function () {
                v.loadURI(url2, /* referrer*/null, postData);
            }, false);
        }

        break;

    case "sametab":
        if (isGet) {
            _content.location.href = url;
        } else {
            loadURI.apply(this, windowarguments);
        }
        break;

    case "newtab":
    default:
        getBrowser().addTab.apply(getBrowser(), tabarguments);
        break;

    case "newtabswitch":
        var tab = getBrowser().addTab.apply(getBrowser(), tabarguments);
        getBrowser().selectedTab = tab;
        break;
    }
}
  
/**
 *	Returns a popuphelper object
 */
libx.ff.getPopupHelper = function () {
	return new libx.ff.utils.ContextPopupHelper ();
};


/**
 *	Initializes the browsers context menu handlers
 *	Ensures that libx.browser.contextMenu.onshowing/onhiding functions
 *	are called as appropriate 
 *		
 */
libx.ui.bd = {
	initializeContextMenu : function (contextmenu) {
	    var menu = document.getElementById("contentAreaContextMenu");
	    menu.addEventListener("popupshowing", function () {
	    	libx.log.write ( "popupshowing w/ contextmenu: " + contextmenu );
	        contextmenu.onshowing();   
	    }, false);
	    menu.addEventListener("popuphidden", function () {
	        contextmenu.onhiding();   
	    }, false );
	}
};

/**
 * Returns a Window object for the primary content window.
 * See https://developer.mozilla.org/en/DOM/window.content
 *
 * @return Window object for content window
 */
libx.ui.getCurrentWindowContent = function() {
    return window.content;
}

/**
 * Represents a browser-dependant Context Menu Item
 */
libx.ui.bd.ContextMenuItem = libx.core.Class.create ( {
	initialize : function () {
		var contMenu = document.getElementById ( "contentAreaContextMenu" );
		var m = document.createElement ( "menuitem" );
		this.menuEntry = m;
		contMenu.insertBefore ( m, 
            document.getElementById ( "libx-endholder" ) );
        var cmo = this;
            
        m.addEventListener ( 'click', function() { cmo.doCommand ( cmo.menuentry ) }, true );
        
		// Hide by default 
        this.setVisible ( false );
	},
	
	doCommand : function () {
		libx.log.write ( "Error: Event handler is not set for menu item" );
	},
	
	/**
     *  Sets the label of an item
     *  @param {String} Label text
     */
	setLabel : function ( text ) {
		this.menuEntry.setAttribute ( 'label', text );
	},
	
	/**
     *	Sets the tooltip title of an item
     *	@param {String} Tooltip text
     */
	setTooltip : function ( text ) {
		this.menuEntry.setAttribute ( 'tooltiptext', text );
	},
	
	/**
     * Sets the event function for the menuitem
     *	@param {Function} handler function to be called when this item is clicked
     */
	setHandler : function ( handlerFunct ) {
		this.doCommand = handlerFunct;
	},
	
	/**
     * Sets the image for a menu object
     *	@param {String} url of the icon
     */
    setIcon : function (iconurl) {
        this.menuEntry.setAttribute ( 'image', iconurl );
        this.menuEntry.setAttribute ( 'class', 'menuitem-iconic' );

        // crude work-around alert.
        // if setImage is called, at least one 1 item is displayed,
        // so make the menu separator visible
        document.getElementById("libx-context-menu-separator").setAttribute("hidden", "false");
    },
	
	/**
	 *	Sets whether this item is visible
	 *	@param {boolean} true if visible
	 */
	setVisible : function( visible ) {
        this.menuEntry.setAttribute ( "hidden", !visible );
    },
	
	/**
	 *	Sets whether this item is active ( able to be clicked )
	 *	@param {boolean} true if it is clickable
	 */
    setActive : function ( active ) {
        this.menuEntry.setAttribute ( "disabled", !active );
    }
} );


/**
 * Creates a URL Bar Icon
 * @class
 *
 * Currently used for FF+CiteULike.
 * Revisit namespace choice later.
 */
libx.ff.utils.UrlBarIcon = libx.core.Class.create(
    /** lends libx.ff.utils.UrlBarIcon.prototype */ {
    /**
     * @constructs
     */
    initialize:  function () {
        var hbox = document.getElementById ( "urlbar-icons" );
        var img = this.img = document.createElement ( "image" );
        hbox.appendChild ( img );
    },
    //* modifies the hidden attribute of the icon
    setHidden : function ( hidden ) {
        if ( hidden )
            this.img.setAttribute ( "hidden", 'true' );
        else
            this.img.setAttribute ( "hidden", 'false' );
    },
    //* sets the image src of the icon
    setImage : function ( img ) {
        this.img.setAttribute ( "src", img );
    },
    //* sets the onclick function of the icon
    setOnclick : function ( onclick ) {
        this.img.addEventListener ( "click", onclick, false );
    },
    //* sets tooltip text
    setTooltipText : function ( text ) {
        this.img.setAttribute ( 'tooltiptext', text );
    }
});

// vim: ts=4

