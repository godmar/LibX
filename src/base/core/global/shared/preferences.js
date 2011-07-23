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
 * This file contains the logic for storing/retrieving preferences
 *    Once initialized, preferences may also be accessed from this namespace
 *    either by using the get ( prefName ) method, or by libx.prefs.path.to.preference
 *
 * @namespace
 */
libx.preferences = (function () {

// Used to determine if the node is an element node, or a text node
var ELEMENT_NODE = 1;

var USER_PREFS = "userprefs.xml";

function log ( msg ) {
    libx.log.write(msg, "preferences");
} 

var prefFactory = new Object();

/**
 *    Base class for the category, preference, and item classes
 */
prefFactory.XMLPreferenceObject = libx.core.Class.create ( {
    initialize : function ( childDescriptor ) {
        for ( var k in childDescriptor ) {
            this[k] = childDescriptor[k];
        }        
    },
    _nodeToDescriptor : function ( node ) {
        var descriptor = {};
        
        for ( var i = 0; i < node.attributes.length; i++ ) {
            var attr = node.attributes.item(i);
            descriptor['_' + attr.localName] = attr.nodeValue;
        }
        
        return descriptor;    
    },
    toXML : function ( ) {
        var sv = new SerializeVisitor();
        sv.visit ( this ); 
        return sv.str;
    }
} );

/**
 *    Javascript representation for a category XML node in the preferences file 
 */
prefFactory["category"] = libx.core.Class.create ( prefFactory.XMLPreferenceObject, 
/** @lends libx.preferences.Category.prototype */ {
    _nodeType : "category",
    
    /**
     *    Initializes a category node
     *    @constructs
     *    @private
     *
     *    @param childDescriptor - Descriptor used to create the category
     *    @param childDescriptor.name - name of the category
     *    @param childDescriptor.layout - layout of the category
     *    @param parent - parent of this category ( should be another category )
     *    @param node - Used Internally
     */
    initialize : function ( childDescriptor, parentName, node ) {
        this._children = new Array();
        if ( childDescriptor == null && node != null ) {
            childDescriptor = this._nodeToDescriptor ( node );
        }
        
        this.parent ( childDescriptor );
        
        if ( parentName != null ) {
            this._idstr = parentName + "." + this._name;
        } else {
            this._idstr = this._name;
        }
        
        this._id = libx.utils.hash.hashString ( this._idstr );
                
        // Used during the initial loading process
        if ( node != null ) {
            for ( var i = 0; i < node.childNodes.length; i++ ) {
                var childNode = node.childNodes.item(i);
                if ( childNode.nodeType == ELEMENT_NODE ) {
                    this._addChild ( null, childNode.localName, childNode );
                }
            }
        }
    },
    
    /**
     *    Adds a preference to this category
     *    @param descriptor 
     *    @see libx.preferences.Preference constructor for a description of the descriptor
     */
    _addPreference : function ( descriptor ) {
        return this._addChild ( descriptor, "preference" );
    },
    
    /**
     *    Adds a category to this category
     *    @param descriptor 
     *    @see libx.preferences.Catalog constructor for a description of the descriptor
     */    
    _addCategory : function ( descriptor ) {
        return this._addChild ( descriptor, "category" );
    },
    
    /**
     *    Used to add children to this category
     *    Either the descriptor or the node is required
     *
     *    @private
     *    @param descriptor : Descriptor for the child element
     *    @param type : Type of the child, must be either "category" or "preference"
     */
    _addChild : function ( descriptor, type, node ) {
        if ( type == null ) {
            type = descriptor._nodeType;
        }
        // Dont add a child if it already exists
        if ( descriptor && this[descriptor._name] != null ) { return this[descriptor._name]; }
        var child = new prefFactory[type](descriptor,this._idstr, node)
        this[child._name] = child;
        this._children.push ( child );
        return child;
    }
} );

/**
 *    Javascript representation for a preference XML node in the preferences file 
 */
prefFactory["preference"] = libx.core.Class.create ( prefFactory.XMLPreferenceObject, 
/** @lends libx.preferences.Preference.prototype */ {
    _nodeType : "preference",
    /**
     *    @constructs
     *    
     *    Initializes a preference object
     *
     *    @param {Object} childDescriptor Descriptor containing information about this preference
     *    @param {String} childDescriptor.name   Name of the preference
     *    @param {String} childDescriptor.layout (Optional) Layout attribute of the preference
     *    @param {String} childDescriptor.type   Type of the preference
     *    @param {String|Number|Boolean} childDescriptor.value  (Optional) Value of the preference
     *
     *    @param {String} parentName Name of the parent category
     *    @param {DOMNode} node  (Optional) Used when loading from XML 
     */
    initialize : function ( childDescriptor, parentName, node ) {
        
        if ( childDescriptor == null && node != null ) {
            childDescriptor = this._nodeToDescriptor ( node );
        }
        
        this.parent( childDescriptor );
        
        this._idstr = parentName + "." + this._name;
        this._id = libx.utils.hash.hashString ( this._idstr );
        
        if (this._type == 'choice') {
            this._items = new Array();
        } else if (this._type == 'multichoice') {
            this._value = new Array();
            this._items = new Array();
        } else {
            this._value = convert ( childDescriptor._value, this._type );
        }
        
        // Only choice and multichoice should have child nodes
        if ( node != null ) {
            for ( var i = 0; i < node.childNodes.length; i++ ) {
                var childNode = node.childNodes.item(i);
                if ( childNode.nodeType == ELEMENT_NODE ) {
                    // Items dont have children, so no need to pass the node along
                    this._addItem ( this._nodeToDescriptor ( childNode ) );
                }
            }
        }
    },
    _setValue : function ( value ) {
        var valid = false;
        if (this._type == 'choice') {
            var items = this._items;
            // check if the item is valid
            for ( var i = 0; i < items.length; i++ ) {
                if ( value == items[i]._value ) {
                    items[i]._selected = true;
                    this._value = value;
                    valid = true;
                }
            }
            
            if ( valid ) {
                // If it is valid, ensure all other items are not selected
                for ( var i = 0; i < items.length; i++ ) {
                    if ( value != items[i]._value ) {
                        items[i]._selected = false;
                    }
                }
                return true;
            } else {
                log ( "Invalid value for choice preference: " + this._name + " = " + value );
                return false;
            }
        } else if (this._type == 'multichoice') {
            var items = this._items;
            // First, we ensure all values are valid
            for ( var i = 0; i < value.length; i++ ) {
                var valueValid = false;
                for ( var j = 0; j < items.length; j++ ) {
                    if ( value[i] == items[j] ) {
                        valueValid = true;
                    }
                }
                if ( valueValid == false ) {
                    log ( "Invalid value for multichoice preference: " + this._name + " = " + value[i] );
                    return false;
                }
            }
            // Next, we set the appropriate selected properties
            for ( var i = 0; i < items.length; i++ ) {
                items[i]._selected = false;
            }
            
            for ( var i = 0; i < value.length; i++ ) {
                for ( var j = 0; j < items.length; j++ ) {
                    if ( value[i] == items[j] ) {
                        items[j]._selected = true;
                    }
                }
            }
            
            this._value = value;
            
            return true;
        } else {
                if ( typeof ( value ) == typeof ( this._value ) ) {
                    this._value = value;
                    return true;
                } else {
                    log ( "Invalid value for preference: Expected " + typeof ( this._value ) + " but recieved " + typeof ( value ) );
                    return false;
                }
        }
    },
    
    /** 
     *    Adds an item to this preference. Only valid if this is a choice or a multichoice preference
     *    @param {Object}                descriptor        Object containing the following properties
     *    @param {Number|Boolean|String} descriptor.value  Value of the item
     *    @param {String}                descriptor.type  (Optional) Type of the item, will be inferred from value if not present
     */
    _addItem : function ( descriptor ) {
        var item = new prefFactory['item'] ( descriptor, this._idstr );
        
        if (this._type == 'choice') {
            this._items.push ( item );
            if ( item._selected ) {
                if ( this._value != null ) {
                    log ( "Error: Multiple selected items found for preference: " + this._name );
                    
                    item._selected = false;
                }
                this._value = item._value;
            }
        } else if (this._type == 'multichoice') {
            this._items.push ( item );
            if ( item._selected )
                this._value.push(item._value);
        } else
            log ( "Error: An attempt was made to add an item to a " + this._type + " preference." );
    },
    
    /**
     *    Removes an item with the specified value
     *    For "choice" preferences, the item must NOT be selected if it is to be removed
     *    @return {boolean} True if successful, else false if no item with provided value was found
     */
    _removeItem : function ( value ) {
        for ( var i = 0; i < this._items.length; i++ ) {
            var item = this._items[i];
            if ( item._value == value ) {
                if (this._type == "choice" && !item._selected) {
                    this._items.splice ( i, 1 );
                    return true;
                } else if (this._type == "multichoice") {
                    this._items.splice ( i, 1 );
                    for (var j = 0; item._selected && j < this._value.length; j++) {
                        if (this._value[j] == value) {
                            this._value.splice(j, 1);
                            break;
                        }
                    }
                    return true;
                }
            }
        }
        return false;
    },
    
    toString : function () {
        return this._value;    
    }
} );

/**
 *    Javascript representation for a item XML node in the preferences file 
 */
prefFactory["item"] = libx.core.Class.create ( prefFactory.XMLPreferenceObject, 
/** @lends libx.preferences.Item.prototype */{
    _value : null,
    _type : null,
    _selected : null,
    _nodeType : "item",
    
    /**
     *    Initializes the item class
     *    @private
     *    @constructs
     *    @param descriptor - descriptor for initializing the item
     *    @param descriptor.value : Value of the preference
     *    @param descriptor.type : Type of the item, optional
     */
    initialize : function ( descriptor, parentName, node ) {
        if ( descriptor == null && node != null ) {
            log ( "ERROR: Item constructor called with a non-null node ( It shouldn't do that )" );        
        }
        
        this.parent( descriptor );
        
        if ( this._type == null ) {
            this._type == typeof ( this._value );
        }
        
        // Ensure our value attribute is of the correct type
        this._value = convert ( this._value, this._type );

        this._idstr = parentName + "." + this._value;
        this._id = libx.utils.hash.hashString ( this._idstr );
        
        // Our selected attribute should be a boolean
        this._selected = convert ( this._selected, 'boolean' );
    },
    /**
     *    @return Value of this preference
     */
    toString : function () {
        return this._value;
    }
} );

/**
 *    Internal Helper function to convert value to correct type
 */
function convert ( value, type ) {
    var val;
    if (type == 'int') {
        val = new Number ( value );
    } else if (type == 'boolean') {
        if ( value == 'true' || value == true ) {
            val = true;
        } else {
            val = false;
        }
    } else {
        val = value;
    }
    
    return val;
}

/**
 *    Default visitor class from which the other visitors inherit
 */
var DefaultVisitor = libx.core.Class.create ( {
    visit : function ( obj ) {
        this[obj._nodeType](obj);
    },
    category : function ( cat ) {
        for ( var i = 0; cat._children && i < cat._children.length; i++ ) {
            var child = cat._children[i];
            this[child._nodeType](child);
        }
    },
    item : function ( item ) {
        // No sub-items here, so stop
    },
    preference : function ( pref ) {
        for ( var i = 0; pref._items && i < pref._items.length; i++ ) {
            var item = pref._items[i];
            this[item._nodeType](item);
        }
    }
} );

/**
 *    Serializes a preference tree into an XML document
 */
var SerializeVisitor = libx.core.Class.create ( DefaultVisitor, {
    str : "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE category SYSTEM \"http://libx.org/xml/libxprefs.dtd\">\n",
    category : function ( cat ) {
        this.str += "<category name=\"" + libx.utils.xml.encodeEntities( cat._name ) + "\" layout=\"" + libx.utils.xml.encodeEntities ( cat._layout ) + "\">\n";
        this.parent ( cat );
        this.str += "</category>\n";
    },
    item : function ( item ) {
        this.str += "<item type=\"" + libx.utils.xml.encodeEntities( item._type ) + "\" value=\"" + libx.utils.xml.encodeEntities( item._value ) + "\" ";
        if ( item._selected ) {
            this.str += "selected=\"" + libx.utils.xml.encodeEntities( item._selected ) + "\""; 
        }
        this.str += "/>\n";
    },
    preference : function ( pref ) {
        this.str += "<preference name=\"" + libx.utils.xml.encodeEntities ( pref._name ) + "\" type=\"" + libx.utils.xml.encodeEntities( pref._type ) + "\" ";
        if (pref._type != "choice")
            this.str += "value=\"" + libx.utils.xml.encodeEntities ( pref._value ) + "\"";
        this.str += " >\n";
        this.parent ( pref );
        this.str += "</preference>\n";
    }
} );

/**
 *    Searches a preference tree for all entries that satisfy the provided match function
 */
var SearchVisitor = libx.core.Class.create ( DefaultVisitor, {
    initialize : function ( matchf ) {
        this.matchf = matchf;
        this.matches = new Array();
    },
    category : function ( cat ) {
        if ( this.matchf ( cat ) ) {
            this.matches.push ( cat );
        }
        this.parent(cat);
    },
    item : function ( item ) {
        if ( this.matchf ( item ) ) {
            this.matches.push ( item );
        }
    },
    preference : function ( pref ) {
        if ( this.matchf ( pref ) ) {
            this.matches.push ( pref );
        }
        this.parent(pref);
    }
} );

return /** @lends libx.preferences */ {

    /**
     *    Initializes the preferences, loading the user preferences from file
     *
     * 
     */
    initialize : function () {
    
        libx.prefs = new prefFactory["category"]({ _name: "prefs" }, "libx");
        libx.prefs._addCategory({ _name: "contextmenu", _layout: "tree" });
                
        /**
         *  Gets a category for a given libapp or module URL.
         *  If the category does not exist, it is constructed with the specified templates.
         *  If the category exists, the templates not found in the category are merged.
         *
         *  @param {String} URL of libapp/module
         *  @param {Array} array of child descriptors for this category
         *  @param {String} childDescriptor.name   Name of the preference
         *  @param {String} childDescriptor.type   Type of the preference
         *  @param {String|Number|Boolean} childDescriptor.value  (Optional) Value of the preference
         *  @param {Object} childDescriptor.options Used for choice type
         */         
        libx.prefs.getCategoryForUrl = function (url, templates) {
            var cat = this[url];
            if (cat == null)
                cat = this._addCategory({ _name: url, _layout: "group" });
            if (templates !== undefined) {
                var changed = false;
                for (var i = 0; i < templates.length; i++) {
                    var template = templates[i];
                    if (template.name in cat)
                        continue;
                    changed = true;
                    var descriptor = {
                        _type: template.type,
                        _name: template.name
                    };
                    if ("value" in template)
                        descriptor._value = template.value;
                    var pref = cat._addPreference(descriptor);
                    if (template.type == "choice" && "options" in template) {
                        for (var j = 0; j < template.options.length; j++) {
                            var option = template.options[j];
                            pref._addItem({
                                _type: "string",
                                _value: option.value,
                                _selected: option.selected == true
                            });
                        }
                    }
                }
                if (changed)
                    libx.preferences.save();
            }
            return cat;
        };
        
        var loadedQueue = new libx.utils.collections.ActivityQueue();
        var browserPrefsAct = new libx.utils.collections.EmptyActivity();
        loadedQueue.scheduleLast(browserPrefsAct);
        var userPrefsAct = new libx.utils.collections.EmptyActivity();
        loadedQueue.scheduleLast(userPrefsAct);
        var doneAct = {
            onready: function () {
                var evt = new libx.events.Event("PreferencesLoaded");
                evt.notify();
            }
        };
        loadedQueue.scheduleLast(doneAct);
        doneAct.markReady();
        
        // initialize browser preferences
        libx.preferences.load ( {
            filename : libx.locale.getBootstrapURL("preferences/builtin/browser.prefs.xml"),
            overwrite : false,
            base : "libx.prefs",
            callback : function () {
                browserPrefsAct.markReady();
            }
        } );  
        
        // load saved preferences
        this.loadUserPrefs(function () {
            userPrefsAct.markReady();
        });
    },

    /**
     * Load preferences from the userprefs XML.
     */
    loadUserPrefs : function (callback) {
        var self = this;
        libx.storage.prefsStore.getItem({
            key: USER_PREFS,
            success: function (text) {
                var userPrefsDoc = libx.utils.xml.loadXMLDocumentFromString(text).documentElement;
                self.loadXML (userPrefsDoc, {
                    filename : USER_PREFS,
                    overwrite: true,
                    base : "libx"
                } );
                callback && callback();
            },
            notfound: function () {
                callback && callback();
            }
        });
    },
    
    /**
     *    Loads an XML file into its javascript representation
     *    @param {XMLPreferenceDescriptor} XMLPreferencesDescriptor
     *        An XMLPreferenceDescriptor, or an array of them
     *    @param XMLPreferenceDescriptor.filename  
     *        Filename of XML preferences file to load
     *    @param XMLPReferenceDescriptor.overwrite 
     *        Determines whether or not these preferences should overwrite values of existing preferences
     *    @param XMLPreferenceDescriptor.base
     *        (optional)Base within preferences tree where subtree should be inserted ( ex, "libx.browser" for libx.browser.contextmenu )
     *    @param XMLPreferenceDescriptor.callback
     *        (optional) Callback to execute once load is complete
     */
    load : function ( descriptor ) {
        var filename = descriptor.filename;
        var overwrite = descriptor.overwrite;
        var base = descriptor.base;

        log ( "loading: " + filename + " overwrite=" + overwrite + " and base=" + base );
        
        var callbackFunct = this.loadXML;
        libx.cache.defaultObjectCache.get ( {
            validator: libx.cache.defaultObjectCache.validators.preference,
            type: 'GET',
            url : filename,
            dataType : "xml",
            success : function (xml) {
                callbackFunct ( xml.documentElement, descriptor );
            },
            error : function (status) {
                libx.log.write('libx.preferences.load(): error ' + status + ' loading preference file ' + filename);
            },
            complete : function () {
                descriptor.callback && descriptor.callback();
            }
        } );
    },
        
    /**
     *    Loads an XML Preferences file
     *    @param node an XML node to parse
     *    @param {XMLPreferenceDescriptor} XMLPreferencesDescriptor
     *        An XMLPreferenceDescriptor, or an array of them
     *    @param XMLPreferenceDescriptor.filename  
     *        (Optional for loadXML ) - Filename of XML preferences file to load
     *    @param XMLPReferenceDescriptor.overwrite 
     *        Determines whether or not these preferences should overwrite values of existing preferences
     *    @param XMLPreferenceDescriptor.base
     *        (optional)Base within preferences tree where subtree should be inserted ( ex, "libx.prefs.browser" for libx.browser.contextmenu )
     */
    loadXML : function ( xmlNode, descriptor ) {
        var overwrite = descriptor.overwrite;
        var base = descriptor.base;
        
        var loadedPrefs = new prefFactory[xmlNode.localName]( null, base, xmlNode );

        if ( descriptor.prefs == null ) {
            descriptor.prefs = loadedPrefs;
        }
        
        // First, see if theres a matching preference we can merge w/
        var currentRoot = libx.preferences.get ( loadedPrefs._idstr );
        if ( currentRoot != null ) {
            mergeHelper ( currentRoot, loadedPrefs, overwrite );
        } else {
            // Find the base node ( its parent )
            var tmproot = null;
            if ( base == null ) {
                base = "libx.prefs";
            }
            
            var baseCategory = libx.preferences.get ( base );
            if ( baseCategory == null || baseCategory._nodeType != "category" ) {
                log ( "loadXML", "Invalid base category specified: " + base );
            }
            
            // Add it to parent, or merge it with its equivalent
            if ( baseCategory[loadedPrefs._name] == null ) {
                baseCategory[loadedPrefs._name] = loadedPrefs;
                baseCategory._children.push ( loadedPrefs );
            } else {
                mergeHelper ( baseCategory, loadedPrefs, overwrite );
            }
        }
            
        /**
         *    Helper function to merge other preference trees with this one
         *    @param curPrefs - Represents an entry in the current preference tree
         *    @param newPrefs - Represents an entry in the new preference tree
         *    @overwrite - indicates whether new preferences should overwrite existing preferences
         *    @private
         */
        function mergeHelper ( curPrefs, newPrefs, overwrite ) {
        
            // add it to libx.prefs
            if ( curPrefs == null ) {
                libx.prefs._addChild ( newPrefs );
                return;
            }
            if ( curPrefs._nodeType != newPrefs._nodeType ) {
                log ( "XMLPreferences.loadUser.loadUserHelper", 
                "Mismatching node types detected. [" + curPrefs._nodeType + ", " + newPrefs._nodeType + "]" );
            }
             
            if (curPrefs._nodeType == 'category') {
                // Call recursively on children present in both
                for ( var i = 0; i < curPrefs._children.length; i++ ) {
                    var curPrefsChild = curPrefs._children[i];
                    for ( var j = 0; j < newPrefs._children.length; j++ ) {
                        var newPrefsChild = newPrefs._children[j];
                        if ( curPrefsChild._id == newPrefsChild._id ) {
                            mergeHelper ( curPrefsChild, newPrefsChild, overwrite );
                        }    
                    }
                }
                
                // Add children only present in newPrefs
                for ( var i = 0; i < newPrefs._children.length; i++ ) {
                    var newPrefsChild = newPrefs._children[i];
                    var found = false;
                    for ( var j =0; j < curPrefs._children.length; j++ ) {
                        var curPrefsChild = curPrefs._children[j];
                        if ( curPrefsChild._id == newPrefsChild._id ) {
                            found = true;
                        }
                    }
                    if ( found == false ) {
                        curPrefs._children.push ( newPrefsChild );
                        curPrefs[newPrefsChild._name] = newPrefsChild;
                    }
                }
            } else if (curPrefs._nodeType == 'preference') {
                // make sure values match ( newPrefs overwrites curPrefs )
                if ( overwrite ) {
                    curPrefs._value = newPrefs._value;
                    curPrefs._type = newPrefs._type; // allows for changing types
                }
                
                if ( curPrefs._items && curPrefs._items.length > 0 ) {
                    for ( var i = 0; i < curPrefs._items.length; i++ ) {
                        var curPrefsItem = curPrefs._items[i];
                        for ( var j = 0; j < newPrefs._items.length; j++ ) {
                            var newPrefsItem = newPrefs._items[j];
                            if ( curPrefsItem._id == newPrefsItem._id ) {
                                mergeHelper ( curPrefsItem, newPrefsItem, overwrite );
                            }
                        }
                    }    
                }
                
                // Add items only present in newPrefs
                if (newPrefs._items && newPrefs._items.length > 0) {
                    if (!curPrefs._items)
                        curPrefs._items = [];
                    for ( var i = 0; i < newPrefs._items.length; i++ ) {
                        var newPrefsItem = newPrefs._items[i];
                        var found = false;
                        for ( var j = 0; j < curPrefs._items.length; j++ ) {
                            var curPrefsItem = curPrefs._items[j];
                            if ( curPrefsItem._id == newPrefsItem._id ) {
                                found = true;
                            }
                        }
                        if ( found == false ) {
                            curPrefs._items.push ( newPrefsItem );
                        }
                    }
                }
            } else if (curPrefs._nodeType == 'item') {
                // make sure selected attributes match ( newPrefs overwrites curPrefs )
                if ( overwrite ) {
                    curPrefs._selected = newPrefs._selected;
                }
            } else {
                log ( "XMLPreferences.loadUser.loadUserHelper",
                    "Invalid node type - " + curPrefs._nodeType );
            }
        }
        
    },
    
    /**
     *    Iterates through all of the loaded roots, and saves them to file...
     */
    save : function () {
        var sv = new SerializeVisitor();
        sv.visit ( libx.prefs ); 
        libx.storage.prefsStore.setItem({
            key: USER_PREFS,
            value: sv.str
        });
    },
    
    /**
     *    Finds and returns an entry by name
     *    Note that this returns the object, not the value of the preference
     *    Use getValue to retrieve the value of a preference
     *
     *    @param 
     *        name of the preference object to retrieve
     *    @return {Category|Preference|Item} 
     *        Entry w/ specified name, or null if it doesnt exist
     */
    get : function ( name ) {
        if ( name == "libx.prefs" ) {
            return libx.prefs;
        }     
        var pref = this.getByID ( libx.utils.hash.hashString ( name ) );
        return pref;
    },
    
    /**
     *    Finds and returns the value of a preference, or the default value if
     *    the preference cannot be found
     *    @param name of the preference to look for
     *    @param default value of the preference
     */
    getValue : function ( name, defValue ) {
        var pref = this.get ( name );
        if ( pref != null && pref._nodeType == "preference" ) {
            return pref._value;
        } 
        
        if ( pref != null && pref._nodeType != "preference" ) {
            log ( "getValue", "Error: Attempt to retrieve preference " + name + " but recieved " + pref._nodeType );
        }
        return defValue;
    },
    /**
     *    Finds and returns an entry by ID
     *    @param 
     *        ID of the value to retrieve
     *    @return {Category|Preference|Item} 
     *        Entry w/ specified ID, or null if it doesnt exist
     */
    getByID : function ( id ) {
        if ( id == libx.utils.hash.hashString ( "libx.prefs" ) ) {
            return libx.prefs;
        }
        
        var searchVisitor = new SearchVisitor ( 
            function(pref) { return id == pref._id; } );
        searchVisitor.visit ( libx.prefs );
        if ( searchVisitor.matches.length > 1 ) {
            log ( "getByID", "More then one match found for id: " + id );
        }
        return searchVisitor.matches[0];
    }
}
})();
