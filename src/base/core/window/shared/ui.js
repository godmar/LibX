
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
 
 
/**
 * Namespace for Browser abstractions
 * @namespace
 */
 
libx.ui.ContextMenu = ( function () 
{ 

/**
 *	This class allows items to be added dynamically to the ContextMenu.
 *	Note that this item must manually be registered with the browsers
 *	event listeners
 */
var ContextMenu = libx.core.Class.create (
/** @lends libx.ui.ContextMenu.prototype */ 
{
	/**
	 *	Initializes this context menu object
	 *	Takes a paramater indicating the groupLists and groups to initialize
	 *	@constructs
	 *	@see menuobjects.js for an example contextMenuObject
	 */
	initialize : function ( /** ContextMenuObject */ contextMenuObject,
                            /** Edition */ edition     ) {
		// Load Preferences
        libx.preferences.load ( {
            filename : "http://libx2.cs.vt.edu/libx.org/libxrestructuring/src/base/bootstrapped/preferences/builtin/contextmenu.prefs.xml",
            overwrite : false,
            base : "libx.prefs"
        } );
		
		var groupLists = this.groupLists = new Array();
		var popuphelper = this.popuphelper = libx.ui.getPopupHelper();
		
		/**
		 *	Function called when ContextMenu is being shown
		 *	@private
		 */
		this.onshowing = function ( p ) {
			for ( var i = 0; i < groupLists.length; i++ ) {
				groupLists[i].onshowing ( popuphelper );
			}
		};
		
		/**
		 *	Function called when ContextMenu is being hidden
		 *	@private
		 */
		this.onhiding = function () {
			for ( var i = 0; i < groupLists.length; i++ ) {
				groupLists[i].onhiding();
			}
		};
		
		if ( contextMenuObject != null ) {
			for ( var i = 0; i < contextMenuObject.length; i++ ) {
				var cmObj = contextMenuObject[i];
				var glist = this.createGroupList ( cmObj.name, cmObj.type );
				var groupsObj = cmObj.groups;
				for ( var j = 0; j < groupsObj.length; j++ ) {
					var groupObj = groupsObj[j];
					var group = glist.createGroup ( groupObj.name, groupObj.match );
					group.REQUIRESTEXTSELECTED = groupObj.REQUIRESTEXTSELECTED;
					var itemsObj = groupObj.createItemDescriptors(edition);
					for ( var k = 0; k < itemsObj.length; k++ ) {
						var itemObj = itemsObj[k];
						group.createItem ( itemObj.type, itemObj.args );
					}
				}
			}
		}		
		libx.ui.bd.initializeContextMenu ( this );
	},

	/**
	 *	Creates a GroupList object, adds it to the ContextMenu and returns it.
	 *	@param {String} name Name of GroupList to create
	 *	@param {GroupList.type} type Type of group list to create
	 *	@return: {GroupList} newly created GroupList object
	 */
	createGroupList : function (name, type) {
		var gl = new GroupList( name, type );
		this.groupLists.push ( gl );
		return gl;
	},
	
	/**
	 *	Iterates through the list of all GroupLists, returning the list with the matched name
	 *	@param {String} name The name to search for
	 *	@return {GroupList} with name = name
	 */
	getGroupList : function ( name ) {
		for ( var i = 0; i < this.groupLists.length; i++ ) {
			var gl = this.groupLists[i];
			if ( gl.name == name ) {
				return gl;
			}
		}
	},

	/**
	 *	Gets the name of all registered GroupLists
	 *	@return {Array} containing name of every GroupList registered to this ContextMenu object
	 */
	getGroupListNames : function () {
		var names = new Array();
		for ( var i = 0; i < this.groupLists.length; i++ ) {
			names.push ( this.groupLists[i].name );
		}
		return names;
	},
	
	
});


/**
 *
 *	GroupList's are designed to hold one or more Group's of Item objects.
 *
 *	When the context menu is shown, the onshowing method is called for each GroupList object,
 *	which in turn iterates through the Group objects in the list.
 *
 *	The type attribute determines whether all Groups in a List will be iterated through ('INCLUDE_ALL_GROUPS'), or
 *	whether the GroupList will stop at the first match
 */
var GroupList = libx.core.Class.create ( 
/** @lends libx.ui.ContextMenu.GroupList.prototype */
{
	/**
	 *	Initializes a GroupList with the provided name and type
	 *	@constructs
	 *	@private
	 *	@see libx.ui.ContextMenu.createGroupList
     */
	initialize: function ( /** String */ name, /** GroupList.type */ type ) {
		this.name = name;
		this.groups = new Array();
		this.type = type;
	},
	
	/**
	 *	Creates, registers, and returns a group with the specified name and match function
	 *	@param name - name of the Group to create
	 *	@param matchfunct - match function to register with this group
	 *		This function should take a single paramater, a popuphelper object
	 *		This function may return any object on a successful match, but must return null when a match is not found
	 *	@return newly created group
	 */
	createGroup : function ( name, matchfunct ) {
		var group = new Group ( name, matchfunct )
		this.groups.push (  group );
		return group;
	},
	
	/**
	 *	This is the function called when the context menu is showing
	 *	This will iterate through all groups in the list, calling the match function on each of them
	 *	If the result from match is not null, it passes this object and the popuphelper to the
	 *	Groups onshowing method
	 *	@param {PopupHelper} p 
	 */
	onshowing : function (p) {
		for ( var i = 0; i < this.groups.length; i++ ) {
			var group = this.groups[i];
			if (  group.onshowing( p ) > 0 ) {
				return;
        	}
		}
	
	},
	/**
	 *	This function is called when the context menu is hidden
	 *	It iterates through all groups, calling onhiding on each
	 */
	onhiding : function () {
		for ( var i = 0; i < this.groups.length; i++ ) {
			var group = this.groups[i];
			group.onhiding();
		}
	},
	/**
	 *	Returns a group with the specified name, or null if
	 *	such a group does not exist
	 *	@param name - Name of the group to search for
	 *	@return Group with matching name, or null if no such group exists
	 */
	getGroup : function ( name ) {
		for ( var i = 0; i < this.groups.length; i++ ) {
			var group = this.groups[i];
			if ( group.name == name ) {
				return group;
                    }
            }
		return null;
	},

	/**
	 *	Returns the names of all of the groups in this group list
	 *	@return Array containing the name of every group in this GroupList
	 */
	getGroupNames : function () {
		var names = new Array();
		for ( var i = 0; i < this.groups.length; i++ ) {
			names.push ( this.groups[i].name );
		}
		return names;
	},

	/**
	 *	createGroupBefore and createGroupAfter based on:
	 *	insertBefore and insertAfter from
	 *		http://extjs.com/forum/showthread.php?t=37697
	 *
	 *	Creates a group, and adds it before an existing group in the GroupList
            *	@param name - The name of the group to be created
            *	@param matchFunct - The match function of the group to be created
            *	@return Group that was created and inserted
             */
    createGroupBefore : function(name, matchFunct, curGroup ){
		var newGroup = new Group ( name, matchFunct );
		var inserted = false;
        var index = this.groups.indexOf(curGroup);
        if(index == -1)
			return null;
		else {
			if(index == 0){
				this.groups.unshift(newGroup)
        }
			else
				this.groups.splice(newGroup, index - 1);
    }
		return newGroup;
    },
    
	/**
	 *	Creates a group, and adds it after an existing group in the GroupList
     *	@param name - The name of the group to be created
     *	@param matchFunct - The match function of the group to be created
	 *	@return Group that was created and inserted
	 */
    createGroupAfter : function(name, matchFunct, curGroup){
		var newGroup = new Group ( name, matchFunct );
		var inserted = false;
		var index = this.groups.indexOf(curGroup);
		if(index == -1)
			return false;
		else {
			if(index == this.groups.length - 1){
				this.groups.push(newGroup);
			}
			else
				this.groups.splice(newGroup, index + 1);
		}   
		return newGroup;
    }
    
} );

/**
 *	Enumeration for the different types of support GroupLists
 *	STOP_AT_FIRST_MATCHING_GROUP - Groups will only be evaluated until one finds a match
 *	INCLUDE_ALL_GROUPS - All groups in the GroupList will be evaluated
 *	@name libx.ui.ContextMenu.GroupList.type
 */
GroupList.type = {
	STOP_AT_FIRST_MATCHING_GROUP: "STOP_AT_FIRST_MATCHING_GROUP",
	INCLUDE_ALL_GROUPS: "INCLUDE_ALL_GROUPS"
};

// Make this visible
ContextMenu.GroupList = { type : GroupList.type };

/**
 *	This represents a group of Items
 *	All items in the group are controlled by the groups match function,
 *	which determines what object will be passed into a Item's onshowing function.
 */
var Group = libx.core.Class.create ( 
/** @lends libx.ui.ContextMenu.Group.prototype */
{
	/**
	 *	Initializes a Group Object
	 *	@param {String} name
	 *	@param {Function} matchFunction This function will be called in the onshowing
	 *				event to determine if there is a suitable match found
	 *	@private
	 *	@constructs
	 *	@see libx.ui.ContextMenu.Group.createGroup
	 */
	initialize : function ( name, matchFunct ) {
		this.name = name;
		this.match = matchFunct;
		this.items = new Array();
	},
	
	/**
	 *	Creates an item with the specified type
	 *	Passes all but first argument to Item Constructor
	 *	@param type - Type of Item to create
	 *	@param args - Any additional arguments are passed to the Item's constructor
	 *	@return Newly created Item
	 */
	createItem : function (type, args) {
		var item = new Item.factory[type] (args);
		if ( item != null ) {
			this.items.push ( item );
		}
		return item;
	},
	
	isEnabled : function ( item ) {
		var name = "libx.prefs.contextmenu." + this.name + "." + item.toString();
        alert(name);
		var pref = libx.preferences.get ( name );
        alert(pref);
		if ( pref ) {
			return pref._value;
		}
		
		return false;
	},

	/**
	 *	Function called when the context menu is showing, and a match has been found
	 *	Iterates through all Item's in this group, and calls the onshowing method on them
	 *	@param popuphelper - popuphelper object to be passed to onshowing method of children
	 *	@param match - Result from this groups match function
	 */
	onshowing : function (popuphelper, match) {
    
		var enabledCount = 0;
		if ( this.REQUIRESTEXTSELECTED && !popuphelper.isTextSelected() ) {
			return 0;
		}
		var match = this.match ( popuphelper );
		if ( match != null ) {
			for ( var i = 0; i < this.items.length; i++ ) {
				var item = this.items[i];		
				
				if ( this.isEnabled( item ) ) {
					enabledCount++;
                    alert("onshowing...");
					item.onshowing(popuphelper, match);
				}
			}
		}
		return enabledCount;
	},

	/**
	 *	Called when the context menu is being hidden
	 *	Calls onHidden on each Item in this group
	 */
	onhiding : function () {
		for ( var i = 0; i < this.items.length; i++ ) {
			this.items[i].onhiding();
		}	
	},

	/**
	 *	@return Array of  { type: 'type', name: 'name', searchType: 'searchType' }  objects, one for each Item in this group
	 */
	getItemDescriptors : function () {
		var names = new Array();
		for ( var i = 0; i < this.items.length; i++ ) {
			var item = this.items[i];
			names.push ( { type: item.type, name: item.name, searchType : item.searchType } );
		}
		return names;
	},
    
	/**
	 *	@param type - type of the Item to return
	 *	@param name - name of the Item to return
	 *	@return Item with given type and name, or null if there was no match
	 */
	getItem : function (itemDescriptor) {
		for ( var i = 0; i < items.length; i++ ) {
			var item = items[i];
			if ( item.type == itemDescriptor.type && 
				item.name == itemDescriptor.name && 
				item.searchType == itemDescriptor.searchType ) {
				return item;
			}
		}
	}
} );

/**
 *	Represents a single entry in the context menu
 *	This class represents the base class from which other
 *  items will inherit
 *	
 *	Items should implement the following functions
 *
 *	onshowing (p)
 *	- Called when this menu item is supposed to be shown
 *	- p: PoupHelper object
 *
 *	initialize (args)
 *	- Called once to initialize the object
 *	- Args are up to implementor to define
 *	
 *	Additionaly, Items should have the following properties
 *	type: unique type attribute for all items of this class
 *	name: unique name attribute for this item
 */
var Item = libx.core.Class.create (
/** @lends libx.ui.ContextMenu.Item.prototype */ 
{
	/**
	 *	@private
	 *	@constructs
	 *	@see libx.ui.ContextMenu.Group.createItem
	 */
	initialize : function ( args ) {
		this.contextMenuItem = new libx.ui.bd.ContextMenuItem();
	},
	
	/**
     *  Sets the label of an item
     *  @param {String} Label text
     */ 
	setLabel : function ( label ) {
		this.contextMenuItem.setLabel ( label );
	}, 
	
	/**
     * Sets the image for a menu object
     *	@param {String} the url of the icon to set
     */
	setIcon : function ( iconurl ) {
		this.contextMenuItem.setIcon ( iconurl );
	},
	
	/**
     *	Sets the tooltip title of an item
     *	@param {String} Tooltip text
     */
	setTooltip : function ( ttip ) {
		if (typeof this.contextMenuItem.setTooltip == "function") {
			this.contextMenuItem.setTooltip ( ttip );
		}
	},
	
	/**
	 *	Sets whether this item is visible
	 *	@param {boolean} true if visible
	 */
	setVisible : function ( visible ) {
		this.contextMenuItem.setVisible ( visible );
	},
	
	/**
     * Sets the event function for the menuitem
     *	@param {Function} handler function to be called when this item is clicked
     */
	setHandler : function ( handler ) {
		this.contextMenuItem.setHandler ( handler );
	},
	
	/**
	 *	Sets whether this item is active ( able to be clicked )
	 *	@param {boolean} true if it is clickable
	 */
	setActive : function ( active ) {
		this.contextMenuItem.setActive ( active );
	},
	writeError : function ( functName ) {
		libx.log.write ( 'contextMenu', functName + ' called with no native menu item initialized' );
	},
	
	/**
	 *	Called when the ContxtMenu being hidden
	 *	@private
	 */
	onhiding : function () { 
		this.setVisible ( false );
	},

	/**
	 *	Function called when the context menu is showing, and a match has been found
	 *	Sets the visibility, label, and onClick handler for this item
	 *	@param {PopupHelper} p
	 *	@param {Object} match Return value from the match function of the Group that
	 *		this item is a part of
	 */
	onshowing : function () { },

	/**
	 *	Set of utility functions to be used by the Item's
	 */
	util : {
		/**
		 *	Shortens a text string if it is to long to display properly in the context menu
		 *	@param text - the string to shorten
		 *	@return A shortened text string
		 */
		computeDisplayText : function ( text ) {
			// XXX handle newlines in the text - they can cause weird symbols
        	return text.length > 25 ? text.substr ( 0, 25 ) + "..." : text;
		}
	},
	
	/**
	 *	Returns the items value as a string
	 */
	toString : function () {
		return this.type + "." + this.name + "." + this.searchType;	
	}

} );

// Factory to store all types of Items
Item.factory = new Array();

/**
 *	Item implementation for catalog objects
 */
Item.factory['catalog'] = libx.core.Class.create ( 
	Item,
/**
 *	@lends libx.ui.ContextMenu.CatalogItem.prototype
 */ 
{
		/** @field */
		type : 'catalog',
		
		/**
		 *	@private
		 *	@augments libx.ui.ContextMenu.Item
		 *	@constructs
		 *	@see libx.ui.ContextMenu.Group.createItem
		 *	@param args Object containing the following fields  
		 *	@param {String} args.name  Name of this item
		 *	@param {String} args.searchType  Search Type for this item
		 */
		initialize : function ( args ) {
			this.parent ( args );
			this.name = args.name;
			this.searcher = libx.edition.catalogs.getByName(this.name);
			this.searchType = args.searchType; 
		},
		
		/**
		 *	Function called when the context menu is showing, and a match has been found
		 *	Sets the visibility, label, and onClick handler for this item
		 *	@param {PopupHelper} p
		 *	@param {Object} Match returned by this groups match function
		 */
		onshowing : function ( popuphelper, match ) {
			var searchType = this.searchType;
			var searcher = this.searcher;
			this.setVisible ( true );
			this.setHandler ( function () {
				libx.ui.openSearchWindow ( 
					searcher.search ( 
						[{ searchType : searchType, searchTerms: match }] 
					) 
				);
			} );
			var displayText = this.util.computeDisplayText ( match );
            this.setLabel (libx.locale.defaultStringBundle.getProperty("catalog.contextmenu.search.label", this.name,
                           libx.edition.searchoptions[this.searchType] + " \"" 
                            + displayText + "\"" ));
        
		}
	}
);

/**
 *	Implementation of the Item class for openurl objects
 *	Derived from the factory['catalog'] class
 */
Item.factory['openurl'] = libx.core.Class.create ( 
	Item.factory['catalog'], 
/** @lends libx.ui.ContextMenu.OpenUrlItem.prototype */
{
		/**@field openurl*/
		type : 'openurl',
		
		/**
		 *	@private
		 *	@constructs
		 *	@see libx.ui.ContextMenu.Group.createItem
		 *	@augments libx.ui.ContextMenu.CatalogItem
		 */
		initialize : function ( args ) {
			this.parent(args);
			this.searcher = libx.edition.openurl.getByName(this.name);
		}
	}
);
            
/**
 *	Implementation of the Item class for proxy objets
 */
Item.factory['proxy'] = libx.core.Class.extend ( 
	Item, 
/** @lends libx.ui.ContextMenu.ProxyItem.prototype */
{
		type : 'proxy',
		searchType : 'enabled',
		/**
		 *	@private
		 *	@constructs
		 *	@augments libx.ui.ContextMenu.Item
		 *	@see libx.ui.ContextMenu.Group.createItem
		 *	@param args Object containing fields below
		 *	@param {String} args.name Name of this object
		 */
		initialize : function (args) {
			this.parent ( args );
			this.name = args.name;
			this.proxy = libx.edition.proxy.getByName ( this.name );
		},
		onshowing : function (popuphelper, match) {
			this.setVisible ( true );
			var proxy = this.proxy;
			var item = this;
			var util = this.util;
			function showLabel ( which, url, proxy ) {
				var p = url;
	            var m = url.match(/http[s]?:\/\/([^\/:]+)(:(\d+))?\/(.*)$/);
            	if (m) {
                	p = m[1];
            	}
            	item.setLabel ( libx.locale.defaultStringBundle.getProperty(which, proxy.name, util.computeDisplayText(p)));
			}
                
            var urltocheck;
            if (popuphelper.isOverLink())
                urltocheck = popuphelper.getNode().href;
            else
                urltocheck = libx.ui.getCurrentWindowContent().location.toString();

            var onsuccesslabel = popuphelper.isOverLink() ? "proxy.follow.label" : "proxy.reload.label";
            if (proxy.canCheck() && libx.utils.browserprefs.getBoolPref ( 'libx.proxy.ajaxlabel', true ) ) {
                showLabel("proxy.checking.label", urltocheck, proxy);

                proxy.checkURL({
                    url: urltocheck,
                    onsuccess: function () {
                        showLabel(onsuccesslabel, urltocheck, proxy);
                        if (proxy.disableIfCheckFails())
                            item.setActive(true);
                    },
                    onfailure: function () {
                        showLabel("proxy.denied.label", urltocheck, proxy);
                        if (proxy.disableIfCheckFails())
                            item.setActive(false);
                    }
                });
            } else {
                showLabel(onsuccesslabel, urltocheck, proxy);
            }
                
                    
			this.setHandler ( function () {
				if (popuphelper.isOverLink()) {
            		var href = popuphelper.getNode().href;
            		libx.ui.openSearchWindow(proxy.rewriteURL(href));
        		} else {
            		var _location = libx.ui.getCurrentWindowContent().location.toString();
            		libx.ui.openSearchWindow(proxy.rewriteURL(_location), "libx.sametab");
        		}
			} );
                
                }
            }
);

/**
 *	Implementation of the Item class for scholar magic search
 */
Item.factory['scholar'] = libx.core.Class.create ( 
	Item, 
/** @lends libx.ui.ContextMenu.ScholarItem.prototype */
{
		type : 'scholar',
		name : 'Google Scholar',
		searchType: 'magicsearch',
		/**
		 *	@constructs
		 *	@augments libx.ui.ContextMenu.Item
		 *	@private
		 *	@see libx.ui.ContextMenu.Group.createItem
		 */
		initialize : function () {this.parent(null);},
		onshowing : function ( popuphelper, match ) {
			this.setVisible ( true );
			var text = libx.utils.string.trim ( match );
			this.setHandler ( function () {
				libx.ui.magicSearch ( text );
			} );
			this.setLabel (libx.locale.defaultStringBundle.getProperty("contextmenu.scholarsearch.label", this.util.computeDisplayText(text) ) );
        }
    }        
);

return ContextMenu;

})();
