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

        this.selectedCatalog.search(fields);
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
                mitem.setAttribute("oncommand", "libxEnv.openSearchWindow('" + link.href + "');");
            libxmenu.insertBefore(mitem, libxmenusep);
        }

        var scholarbutton = document.getElementById("libx-magic-button");
        
        if (edition.options.disablescholar) {
            scholarbutton.hidden = true;
        } else {
            new libx.ff.utils.TextDropTarget(magicSearch).attachToElement(scholarbutton);
        }

        // add the selected search as a default target
        var searchbutton = document.getElementById("libx-search-button");
        new libx.ff.utils.TextDropTarget(function (data) {
            libx.ff.toolbar.selectedCatalog.search([{ searchType: 'Y', searchTerms: data }]);
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

    libxChromeWindow = window;

    // this function is called after the entire overlay has been built
    // we must wait until here before calling document.getElementById
    libxProps = document.getElementById("libx-string-bundle");

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
    
    libx.ff.contextmenu.initialize();
}

/**
 * Activate a new configuration
 */
libx.ff.activateConfiguration = function (edition) {
    this.toolbar.activateConfiguration(edition);
}

libx.ff.getXMLHttpReqObj = function () {
    var xmlhttp = new XMLHttpRequest();
    return xmlhttp;
};

// open search results, according to user preferences
libxEnv.openSearchWindow = function (url, pref) {
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

    var what = pref ? pref : libx.utils.browserprefs.getStringPref("libx.displaypref", "libx.newtabswitch");

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
    case "libx.newwindow":
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

    case "libx.sametab":
        if (isGet) {
            _content.location.href = url;
        } else {
            loadURI.apply(this, windowarguments);
        }
        break;

    case "libx.newtab":
    default:
        getBrowser().addTab.apply(getBrowser(), tabarguments);
        break;

    case "libx.newtabswitch":
        var tab = getBrowser().addTab.apply(getBrowser(), tabarguments);
        getBrowser().selectedTab = tab;
        break;
    }
}


// asynchronous now; still in transition
libxEnv.getXMLConfig = function (invofcc) {
    var xhrParams = {
        url : invofcc.url,
        dataType : "xml",
        type     : "GET",

        complete : function (xml, stat, xhr) {
            invofcc.onload(xhr);
        },

        bypassCache : true 
    };

    return libx.cache.memorycache.getRequest(xhrParams);
};

/*
 * Load XML String into a XMLDocument
 *
 */
libxEnv.loadXMLString = function (xmlstring) {
    parser = new DOMParser();
    return parser.parseFromString(xmlstring,"text/xml");
}
  
libx.ff.log = {
    /**
     * Write a message to the JS console
     * @param {String} msg message to write
     */
    write : function (msg) {
        var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
            .getService(Components.interfaces.nsIConsoleService);
        consoleService.logStringMessage(msg);
    }
}

//Just use the mozilla event listener function
/* NB: addEventListener always adds the listener; if the same listener is
 * already registered, it will be registered twice.
 */
libxEnv.addEventHandler = function(obj, event, func, b) {
    if(!obj) obj = window;
    if(!b) b = false;
    try {
        return obj.addEventListener(event, func, b);
    }
    catch (e)
    {
        alert ( "failing function called from " + arguments.caller );
    }
}

//Moved here since IE doesn't need this code
libxEnv.addEventHandler(window, "load", 
    function () {
        var ac = document.getElementById("appcontent");
        if (ac) {
            libxEnv.addEventHandler(ac, "DOMContentLoaded", libxEnv.doforurls.onPageComplete_ff, true);
        }
    },
    false);

/**
 *	Returns a popuphelper object
 */
libx.ff.getPopupHelper = function () {
	return new libx.ff.utils.ContextPopupHelper ();
};

libx.ff.contextmenu = {};
/**
 *	Initializes the browsers context menu handlers
 *	Ensures that libx.browser.contextMenu.onshowing/onhiding functions
 *	are called as appropriate 
 *		
 */
libx.ff.contextmenu.initialize = function () {
    var menu = document.getElementById("contentAreaContextMenu");
    menu.addEventListener("popupshowing", function () {
        libx.browser.contextMenu.onshowing();   
    }, false);
    menu.addEventListener("popuphidden", function () {
        libx.browser.contextMenu.onhiding();   
    }, false );
}; 

// Returns the full file path for given path
// Chrome paths are left unchanged
// Any other paths should be file names only
// and will be put in %profile%/libx
libxEnv.getFilePath = function ( path ) {
    var file;
    try {
        if ( path.indexOf ( 'chrome' ) >= 0 ) {
            return path;
        }
        else {
           file = DirIO.get ( 'ProfD' );
            file.append ( 'libx' );
            
            if ( !file.exists() ) {
                file = DirIO.create(file);
            }
            
            file.append ( path );
            return FileIO.path ( file );
        }
    }
    catch ( e ) {
        return null;
    }
}

// Assumes /libx directory off of profile if an absolute chrome path is
// not specified
// modified: can now create the file if 3rd param is passed as true
libxEnv.writeToFile = function ( path, str, create ) {
    var file;
    if ( create == true )
        file = libxEnv.getFile( path, true );
    else
        file = libxEnv.getFile ( path );
    if ( !FileIO.write ( file, str ) )
        return;
        //alert( "Write didnt happen" );
}


// Returns file for given path
// modified: now able to take path with folders and will create the folders if
// not there if second param is passed as true
libxEnv.getFile = function ( path, create ) {
    var file;
    if ( path.indexOf ( 'chrome' ) == 0 )
        file = FileIO.openChrome( path );
    else {
        file = DirIO.get ( 'ProfD' );
        file.append ( 'libx' );
        
        if ( !file.exists() ) {
            DirIO.create(file);
        }
        
        var patharray = path.split( "/" );
        for (var i = 0; i < (patharray.length - 1); i++ )
        {
            file.append( patharray[i] );
            if ( !file.exists() && create ) {
                DirIO.create(file);
            }
        }
        file.append( patharray[patharray.length-1] );
        if ( !file.exists() && create ) {
            FileIO.create(file);
        }
    }
    return file;
}


//Gets the text of a file.
libxEnv.getFileText = function (path) {
    var file = libxEnv.getFile(path);
    //Note that FileIO.read closes the file, so we're not leaking a handle
    return FileIO.read(file);
}

// Used to get the defaultprefs.xml and userprefs.xml files
libxEnv.getLocalXML = function ( path ) {
    var urlpath = libxEnv.getFilePath(path);
    var xhrParams = {
        url         : urlpath,
        type        : "GET",
        dataType    : "xml",
        bypassCache : true
    };
    return libx.cache.memorycache.getRequest(xhrParams);
    //return libxEnv.getXMLDocument ( libxEnv.getFilePath ( path ) );
}

// Used to remove userprefs.xml
libxEnv.removeFile = function ( path ) {
    var file = libxEnv.getFile ( path );
    FileIO.unlink ( file );
}


libxEnv.getCurrentWindowContent = function() {
    return window._content;
}

/*
 * Adds a object to the context menu
 * and returns a reference to that object
 */
libxEnv.addMenuObject = function (menuEntry) {
    var contMenu = document.getElementById("contentAreaContextMenu");  
    var m = document.createElement ( "menuitem" );
    m.menuentry = menuEntry;
    contMenu.insertBefore ( m, 
            document.getElementById ( "libx-endholder" ) );

    m.docommand = function () { 
        alert("LibX bug: menu handler not set!");
    }
    m.setAttribute ( 'oncommand', "this.docommand(this.menuentry);" );

    /*
     * Sets the label of an item
     */
    m.setLabel = function ( text ) {
        this.setAttribute ( 'label', text );
    }
    
    /*
     * Sets the tooltip title of an item
     */
    m.setTooltip = function ( text ) {
        this.setAttribute ( 'tooltiptext', text );
    }

    /*
     * Sets the event function for the menuitem
     */
    m.setHandler = function ( handlerfunc ) {
        this.docommand = handlerfunc;
    }
    
    /*
     * Sets the image for a menu object
     */
    m.setImage = function () {
        this.setAttribute ( 'image', 
                    document.getElementById ( 'toolbarFieldsMenu' ).
                    getAttribute ( 'image' ) );
        this.setAttribute ( 'class', 'menuitem-iconic' );

        // crude work-around alert.
        // if setImage is called, at least one 1 item is displayed,
        // so make the menu separator visible
        libxEnv.setVisible("libx-context-menu-separator", true);
    }
    
    m.setVisible = function( visible ) {
        this.setAttribute ( "hidden", !visible );
    }

    m.setActive = function ( active ) {
        this.setAttribute ( "disabled", !active );
    }

    m.setVisible (false);
    return m;
}

libxEnv.removeMenuObject = function (menuitem) {
    var contMenu = document.getElementById("contentAreaContextMenu");  
    contMenu.removeChild ( menuitem );
}

/////// Preferences dialog functions
libxEnv.initPrefsGUI = function () {
    // Set the title
    var edition = libxEnv.xmlDoc.getAttr("/edition/name", "edition");
    
	libx = window.opener.libx;
	libxEnv.updateFunc = window.opener.libxEnv.doforurls.updateDoforurls;
    

    /****** Initialize the default preferences tab *********/
    // Initialize the display preferences radiogroup
    document.getElementById ( 'libx-display-prefs' ).selectedItem = 
        document.getElementById ( libx.utils.browserprefs.getStringPref ( "libx.displaypref", "libx.newtabswitch" ) );
        
    // Initialize the autolinking checkbox
    document.getElementById ( "libx-autolink-checkbox" )
        .setAttribute ( "checked", libx.utils.browserprefs.getBoolPref ( "libx.autolink", true ) );
    
    /****** Initialize the context menu preferences tab *****/
    libxInitContextMenuTrees();
    
    /***** Initialize the AJAX tab ****/
    // Figure out whether Proxy checkbox should be grayed out or not
    var ajaxenabled = false;

    for ( var i = 0; i < libx.edition.proxy.length; i++ ) {
        if ( libx.edition.proxy[i].urlcheckpassword )
            ajaxenabled = true;
    }
    
    if ( ajaxenabled ) {
        document.getElementById ( 'libx-proxy-ajax-checkbox')
            .setAttribute ( 'checked', libx.utils.browserprefs.getBoolPref ( 'libx.proxy.ajaxlabel', 'true' ) ? 'true' : 'false' );
    } else {
        document.getElementById ( 'libx-proxy-ajax-checkbox' )
            .setAttribute ( 'disabled', 'true' );
    }
    document.getElementById ( 'libx-oclc-ajax-checkbox')
        .setAttribute ( 'checked', libx.utils.browserprefs.getBoolPref ( 'libx.oclc.ajaxpref', 'true' ) ? 'true' : 'false' );
    document.getElementById ( 'libx-doi-ajax-checkbox')
        .setAttribute ( 'checked', libx.utils.browserprefs.getBoolPref ( 'libx.doi.ajaxpref', 'true' ) ? 'true' : 'false' );
    document.getElementById ( 'libx-pmid-ajax-checkbox')
        .setAttribute ( 'checked', libx.utils.browserprefs.getBoolPref ( 'libx.pmid.ajaxpref', 'true' ) ? 'true' : 'false' );
    
    
    
    
    
    document.getElementById ( 'libx-citeulike-checkbox' )
        .setAttribute ( 'checked', libx.utils.browserprefs.getBoolPref ( 'libx.urlbar.citeulike', 'true' ) ? 'true' : 'false' );
}

libxEnv.resetToDefaultPrefs = function() {
    // Re-set prefs to default
    var nodes = document.getElementsByTagName ( 'treecell' );
    for ( var i = 0; i < nodes.length; i++ ) {
        var node = nodes[i];
        if ( node.getAttribute ( 'value' ) ) {
            if(isEnabled ( node.getAttribute ( 'id' ) )) {
                node.setAttribute ( 'properties', 'enabled' );
            }
            else {
                node.setAttribute ( 'properties', 'disabled' );
            }
        }
    }
}

libxEnv.getDisplayPref = function() {
    return document.getElementById ( "libx-display-prefs" ).selectedItem.id;
};

libxEnv.getAutolinkPref = function() {
    return document.getElementById ( "libx-autolink-checkbox" ).getAttribute ( "checked" ) == 'true';
};

libxEnv.getProxyPref = function() {
    return document.getElementById ( 'libx-proxy-ajax-checkbox' ).getAttribute ( 'checked' ) == 'true';
};

libxEnv.getOCLCPref = function() {
    return document.getElementById ( 'libx-oclc-ajax-checkbox' ).getAttribute ( 'checked' ) == 'true';
};

libxEnv.getDOIPref = function() {
    return document.getElementById ( 'libx-doi-ajax-checkbox' ).getAttribute ( 'checked' ) == 'true';
};

libxEnv.getPMIDPref = function() {
    return document.getElementById ( 'libx-pmid-ajax-checkbox' ).getAttribute ( 'checked' ) == 'true';
};

libxEnv.getDFUPref = function() { return true; } //Doesn't apply to Firefox

libxEnv.getCiteulikePref = function () {
    return document.getElementById ( 'libx-citeulike-checkbox' ).getAttribute ( 'checked' ) == 'true';
}

libxEnv.removeContextMenuPreferencesTab = function (idbase) {
    var tabId = "libx-contextmenu-" + idbase + "-prefs-tab";
    var tabPanelId = "libx-" + idbase + "-tab";
    var id = "libx-contextmenu-" + idbase + "-prefs-tree";
        
    var tab = document.getElementById ( tabId );
    var tabPanel = document.getElementById ( tabPanelId );
    var tabPanels = tabPanel.parentNode;
    
    tab.parentNode.removeChild ( tab );
    tabPanel.parentNode.removeChild ( tabPanel );
}

/* Returns all nodes which are checked
 * @param tree {libxEnv.PrefsTree}  A tree node
 */
libxEnv.getEnabledNodes = function (tree) {
    /*
        Copyright Robert Nyman, http://www.robertnyman.com
        Free to use if this text is included
    */
    function getElementsByAttribute(oElm, strTagName, strAttributeName, strAttributeValue){
        var arrElements = (strTagName == "*" && oElm.all)? oElm.all : oElm.getElementsByTagName(strTagName);
        var arrReturnElements = new Array();
        var oAttributeValue = (typeof strAttributeValue != "undefined")? new RegExp("(^|\s)" + strAttributeValue + "(\s|$)") : null;
        var oCurrent;
        var oAttribute;
        for(var i=0; i<arrElements.length; i++){
            oCurrent = arrElements[i];
            oAttribute = oCurrent.getAttribute && oCurrent.getAttribute(strAttributeName);
            if(typeof oAttribute == "string" && oAttribute.length > 0){
                if(typeof strAttributeValue == "undefined" || (oAttributeValue && oAttributeValue.test(oAttribute))){
                    arrReturnElements.push(oCurrent);
                }
            }
        }
        return arrReturnElements;
    }

    enabledNodes = new Array();
    nodeList = getElementsByAttribute (tree.node, 'treecell', 'properties', 'enabled');
    for(var i = 0; i < nodeList.length; ++i) {
        var n = libxFindInTree(nodeList[i].id, tree);
        if(n) {
            enabledNodes.push(n);
        }
    }
    return enabledNodes;
}

/*  PrefsTreeRoot object
 * Object representing a tree root.
 * 
 * @param treeNode {DOMElement}  A <tree> element
 *
 * This object is a non-visible container of PrefsTreeNode objects.
 */
libxEnv.PrefsTreeRoot = function(treeNode, id)
{
    this.node = treeNode;
    this.children = new Array();
    this.id = id;
}

/*  getChild
 * Locates the child with the given ID.
 *
 * @param id {string}        The ID of the child to locate
 * 
 * @returns {PrefsTreeNode}  The located child node, or null if not found
 */
libxEnv.PrefsTreeRoot.prototype.getChild = function (id) {
    for(var i = 0; i < this.children.length; ++i) {
        if(this.children[i].id == id) {
            return this.children[i];
        }
    }
    return null;
}

/*  createChild
 * Creates a child node (PrefsTreeNode) and appends it.
 * 
 * @param label {string}     The label of the node (visible to user)
 * @param id {string}        A unique node identifier
 * @param attrs {object}     Name, value pairs used to set node attributes
 *
 * @returns {PrefsTreeNode}  The new child node
 */
libxEnv.PrefsTreeRoot.prototype.createChild = function (label, id, attrs) {
    //Create the node object.
    var child = new libxEnv.PrefsTreeNode(this.node, label, id, attrs);
    this.children.push(child);

    return child;
};

libxEnv.PrefsTreeRoot.prototype.isEnabled = function() {
    return false;
}

/*  PrefsTreeNode object
 * Object representing a tree node.
 * 
 * @param parent {DOMElement}  A <tree> or <treeitem> element
 * @param label {string}       The label of the node (visible to user)
 * @param id {string}          A unique node identifier
 * @param attrs {object}       Name, value pairs used to set node attributes
 */
libxEnv.PrefsTreeNode = function (parent, label, id, attrs) {
    var tchildren = null;
    var createAsSibling = false;

    //Attempt to get an existing treechildren node (there should only be one)
    for(var i = 0; i < parent.childNodes.length; ++i) {
        if(parent.childNodes[i].nodeName.toLowerCase() == 'treechildren') {
            tchildren = parent.childNodes[i];
            createAsSibling = true;
            break;
        }
    }

    if(!createAsSibling) { //We need to make a treechildren node
        //Configure the parent
        parent.setAttribute('container', true);
        //Create a treechildren node to form a nested list
        tchildren = document.createElement('treechildren');
        parent.appendChild(tchildren);
    }

    //Create the child node and append to parent
    var titem = document.createElement('treeitem');
    var trow = document.createElement('treerow');
    var tcell = document.createElement('treecell');
    trow.appendChild(tcell);
    titem.appendChild(trow);
    tchildren.appendChild(titem);

    //Configure child node
    for(var a in attrs) {
        tcell.setAttribute(a, attrs[a]);
    }
    //Set the node label
    tcell.setAttribute('label', label);
    titem.setAttribute('onclick', 'toggleImage(this.children[0].children[0])');

    this.node = titem;
    this.children = new Array();
    this.id = id;
};

libxEnv.PrefsTreeNode.prototype.setExpanded = function (expanded) {
    if (expanded) {
        this.node.setAttribute ( 'open', 'true' );
    }
}

libxEnv.PrefsTreeNode.prototype.isEnabled = function() {
    if(this.node.hasAttribute('properties')) {
        libx.log.write("====" + this.id + " has properties attribute " + this.node.getAttribute('properties'));
        return this.node.getAttribute('properties').toLocaleLowerCase() == 'enabled';
    }
    libx.log.write("====" + this.id + " has no properties attribute");
    return false;
}

libxEnv.PrefsTreeNode.prototype.toggleEnabled = function() {
    if(this.node.getAttribute ('properties') == 'enabled') {
        this.node.setAttribute ( 'properties', 'disabled' )
    }
    else {
        this.node.setAttribute ( 'properties', 'enabled' );
    }
}

libxEnv.PrefsTreeNode.prototype.getChild = libxEnv.PrefsTreeRoot.prototype.getChild;

libxEnv.PrefsTreeNode.prototype.createChild = libxEnv.PrefsTreeRoot.prototype.createChild;

/*
 * Initializes a tree and inserts the top-level nodes.
 * @param treeID {string}    The node id of the tree to initialize
 * @param items {array}      Labels & ids to create entries for
 * @returns {PrefsTreeNode}  Node containing the children, or null if no items
 *
 * The 'items' array is used to create top-level nodes for the tree. So if,
 * for example, we wanted to have two top-level nodes (Catalogs and
 * OpenURL Resolvers), items would have two elements.
 *
 * Each element is an object with at least the label and id properties set.
 * Any additional properties are added as attributes to the node.
 */
libxEnv.initTree = function(treeID, items) {
    if(items.length == 0) {
        return null;
    }
    var tree = document.getElementById(treeID);
    
    //Configure the tree
    tree.setAttribute('width', '250');
    tree.setAttribute('height', '150');
    tree.setAttribute('onclick', 'treeEventHandler(event, this);');
    tree.setAttribute('flex', '1');
    tree.setAttribute('container', true);

    //Create the root for the tree
    var root = new libxEnv.PrefsTreeRoot(tree, treeID);

    //Create the initial items
    for (var i in items) {
        root.createChild(items[i].label, items[i].id, items[i]);
    }
    return root;
};


// Initializes a URL Bar Icon with the setters defined below
libxEnv.urlBarIcon = function () {
    var hbox = document.getElementById ( "urlbar-icons" );
    var img = this.img = document.createElement ( "image" );
    hbox.appendChild ( img );
}

libxEnv.urlBarIcon.prototype = {
    // modifies the hidden property of the icon
    setHidden : function ( hidden ) {
        if ( hidden == 'true' || hidden == null || hidden == true )
            this.img.setAttribute ( "hidden", 'true' );
        else
            this.img.setAttribute ( "hidden", 'false' );
    },
    // sets the image src of the icon
    setImage : function ( img ) {
        this.img.setAttribute ( "src", img );
    },
    // sets the onclick function of the icon
    setOnclick : function ( onclick ) {
        libxEnv.addEventHandler ( this.img, "click", onclick );
    },
    setTooltipText : function ( text ) {
        this.img.setAttribute ( 'tooltiptext', text );
    }
}



// Initializes the event dispatcher
libxEnv.eventDispatcher.init = function  () {

    // Helper function to add an eventDispatcher of the given type to the eventDispatcher object
    // This registers the notify function as the result of an event of eventType on targetObj
    // @param libxtype -- type of event to register with
    // @param targetObj -- object to register event handler with
    // @param eventType -- type of event to watch for
    function registerEventDispatcher ( libxtype, targetObj, eventType ) {
        libxEnv.addEventHandler ( targetObj, eventType, function ( e ) {
            libxEnv.eventDispatcher.notify(libxtype, e);
        } );
    }
    
    
    // Init for onContentChange
    var container = gBrowser.tabContainer;
    registerEventDispatcher ( "onContentChange", container, "TabOpen" );
    registerEventDispatcher ( "onContentChange", container, "TabSelect" );
    var appcontent = document.getElementById ( 'appcontent' );
    registerEventDispatcher ( "onContentChange", appcontent, "pageshow" );
    //-------------------------
} 


// vim: ts=4


