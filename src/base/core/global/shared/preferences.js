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
 * Once initialized, preferences may also be accessed from this namespace
 * either by using libx.preferences.get(prefName), or by
 * libx.prefs.path.to.preference.
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

var XMLPreferenceObject = libx.core.Class.create(
    /** @lends libx.preferences.XMLPreferenceObject.prototype */ {

    /**
     * Base class for the category, preference, and item classes.
     *
     * @constructs
     * @param {Object} descriptor  mixin descriptor.  all properties in the
     *                             descriptor are mixed into this preference
     *                             object.
     */
    initialize : function ( descriptor ) {
        for ( var k in descriptor ) {
            this[k] = descriptor[k];
        }        
    },

    /**
     * The type of this preference node.
     *
     * @type String
     * @private
     */
    _nodeType: null,

    /**
     * Builds a descriptor object based on an XML node.  All property names are
     * prepended with an underscore.  For example, an XML node with a single id
     * attribute with the value "prefid" will return the descriptor { _id: "prefid" }.
     *
     * @param {Node} node  the XML node to process
     * @returns {Object}   a descriptor object from the node's attributes
     */
    _nodeToDescriptor : function ( node ) {
        var descriptor = {};
        
        for ( var i = 0; i < node.attributes.length; i++ ) {
            var attr = node.attributes.item(i);
            
            descriptor['_' + (attr.localName || attr.nodeName.replace("libx:",""))] = attr.nodeValue;
        }
        
        return descriptor;    
    },

    /**
     * Serializes this preference object to an XML string.
     *
     * @returns {String}  the serialized preference object
     */
    toXML : function ( ) {
        var sv = new SerializeVisitor();
        sv.visit ( this ); 
        return sv.str;
    }
} );

/**
 * Used to instantiate various preference node types.
 * @name libx.preferences.XMLPreferenceObject.factory
 * @namespace
 */
var prefFactory = XMLPreferenceObject.factory = {};

prefFactory["category"] = libx.core.Class.create ( XMLPreferenceObject, 
    /** @lends libx.preferences.XMLPreferenceObject.factory.category.prototype */ {
    _nodeType : "category",
    
    /**
     * Javascript representation for a category XML node in the preferences file.
     *
     * @constructs
     * @augments libx.preferences.XMLPreferenceObject
     * @param  {Object} descriptor  descriptor used to create the category
     * @config {String} _name    name of the category
     * @config {String} _layout  (optional) layout of the category
     * @param  {String} parent   parent of this category ( should be another category )
     * @param  {Node} node       (optional) DOM Node used when loading from XML 
     */
    initialize : function ( descriptor, parentName, node ) {
        this._children = new Array();
        if ( descriptor == null && node != null ) {
            descriptor = this._nodeToDescriptor ( node );
        }
        
        this.parent ( descriptor );
        
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
                    this._addChild ( null, (childNode.localName || childNode.nodeName.replace("libx:","")), childNode );
                }
            }
        }
    },
    
    /**
     *    Adds a preference to this category.
     *
     *    @param descriptor  descriptor object
     *    @see libx.preferences.XMLPreferenceObject.factory.category constructor for a description of the descriptor
     *    @returns {libx.preferences.XMLPreferenceObject} the added preference object
     */
    _addPreference : function ( descriptor ) {
        return this._addChild ( descriptor, "preference" );
    },
    
    /**
     *    Adds a category to this category.
     *
     *    @param descriptor  descriptor object
     *    @see libx.preferences.XMLPreferenceObject.factory.category constructor for a description of the descriptor
     *    @returns {libx.preferences.XMLPreferenceObject} the added preference object
     */    
    _addCategory : function ( descriptor ) {
        return this._addChild ( descriptor, "category" );
    },
    
    /**
     *    Used to add children to this category.
     *    Either the descriptor or the node is required.
     *
     *    @private
     *    @param {Object} descriptor  descriptor object
     *    @see libx.preferences.XMLPreferenceObject.factory.category constructor for a description of the descriptor
     *    @param {String} type  type of the child, must be either "category" or "preference"
     *    @returns {libx.preferences.XMLPreferenceObject} the added preference object
     */
     // node parameter is used internally
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

prefFactory["preference"] = libx.core.Class.create ( XMLPreferenceObject, 
    /** @lends libx.preferences.XMLPreferenceObject.factory.preference.prototype */ {

    _nodeType : "preference",

    /**
     * Javascript representation for a preference XML node in the preferences file.
     *
     * @constructs
     * @param  {Object} descriptor  descriptor object
     * @config {String} _name       name of the preference
     * @config {String} _layout     (optional) layout of the preference
     * @config {String} _type       type of the preference
     * @config {String|Number|Boolean} _value  (optional) value of the preference
     * @param  {String} parentName  name of the parent category
     * @param  {Node} node          (optional) DOM Node used when loading from XML 
     */
    initialize : function ( descriptor, parentName, node ) {
        
        if ( descriptor == null && node != null ) {
            descriptor = this._nodeToDescriptor ( node );
        }
        
        this.parent( descriptor );
        
        this._idstr = parentName + "." + this._name;
        this._id = libx.utils.hash.hashString ( this._idstr );
        
        if (this._type == 'choice') {
            this._items = new Array();
        } else if (this._type == 'multichoice') {
            this._value = new Array();
            this._items = new Array();
        } else {
            this._value = convert ( descriptor._value, this._type );
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

    /**
     * Sets the value for this preference.
     * Value type must coincide with preference type.
     *
     * @param {String|Number|Boolean} value  the new value
     * @returns {Boolean}  whether the value was successfully set
     */
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
     *    Adds an item to this preference.
     *    Only valid if this is a choice or multichoice preference.
     *
     *    @param {Object} descriptor  descriptor object
     *    @see libx.preferences.XMLPreferenceObject.factory.item constructor for a description of the descriptor
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
     *
     *    @param {String|Number|Boolean} value   the value of the item to be removed
     *    @return {Boolean}  true if successful, else false if no item with provided value was found
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
    
    /**
     * Get this preference's value.
     *
     * @returns {String}  this preference's value
     */
    toString : function () {
        return this._value;    
    }
} );

prefFactory["item"] = libx.core.Class.create ( XMLPreferenceObject, 
    /** @lends libx.preferences.XMLPreferenceObject.factory.item.prototype */ {

    _value : null,
    _type : null,
    _selected : null,
    _nodeType : "item",
    
    /**
     *    Javascript representation for a item XML node in the preferences file 
     *
     *    @constructs
     *    @param  {Object} descriptor  descriptor for initializing the item
     *    @config {String} _value      value of the preference
     *    @config {String} _type       (optional) type of the item
     *    @param  {String} parentName  name of the parent category
     *    @param  {Node} node          (optional) DOM Node used when loading from XML 
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
     *    @return {String} value of this item
     */
    toString : function () {
        return this._value;
    }
} );

/*
 * Internal Helper function to convert value to correct type
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

/*
 *  Default visitor class from which the other visitors inherit
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

/*
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

/*
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
     *    Initializes the preferences, loading the user preferences from LibX storage.
     */
    initialize : function () {
    
        /**
         * The in-memory representation of the user preferences.
         *
         * @type libx.preferences.XMLPreferenceObject.factory.category
         * @namespace
         */
        libx.prefs = new prefFactory["category"]({ _name: "prefs" }, "libx");
        libx.prefs._addCategory({ _name: "contextmenu", _layout: "tree" });
                
        /**
         *  Gets a category for a given libapp or module URL.
         *  If the category does not exist, it is constructed with the specified templates.
         *  If the category exists, the templates not found in the category are merged.
         *
         *  @function
         *  @param {String} url       URL of libapp/module
         *  @param {Array[template]}  templates array of child descriptors for this
         *                            category.  the following describes each object in this array:
         *  @param {String} template.name     name of the preference
         *  @param {String} template.type     type of the preference
         *  @param {String|Number|Boolean} template.value  (optional) value of the preference
         *  @param {Array[option]} template.options   array of item descriptor objects; used for choice types.
         *                            each descriptor must have a "value" property which will become
         *                            the Item's string.  each descriptor may optionally have a "selected"
         *                            boolean property to indicated whether the item is selected.
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
        
        // load the external browser preferences XML file and the user
        // preferences from LibX storage before notifying the PreferencesLoaded
        // event
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
            filename : libx.utils.getBootstrapURL("preferences/builtin/browser.prefs.xml"),
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
     * Load preferences from the userprefs XML in LibX storage.
     * 
     * @param {Function()} callback  callback to execute once the XML has been loaded
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
     *    @param  {Object}  descriptor  descriptor object
     *    @config {String}  filename    filename of XML preferences file to load
     *    @config {Boolean} overwrite   determines whether or not these
     *                                  preferences should overwrite values of
     *                                  existing preferences
     *    @config {String}  base        (optional) base within preferences tree
     *                                  where subtree should be inserted ( ex, "libx.browser" for
     *                                  libx.browser.contextmenu )
     *    @config {Function()} callback (optional) callback to execute once load is complete
     */
    load : function ( descriptor ) {
        var filename = descriptor.filename;
        var overwrite = descriptor.overwrite;
        var base = descriptor.base;

        log ( "loading: " + filename + " overwrite=" + overwrite + " and base=" + base );
        
        var callbackFunct = this.loadXML;
        libx.cache.defaultObjectCache.get ( {
            validator: libx.cache.validators.preference,
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
     *    Load an XML preferences file.
     *    The document will be merged into the in-memory LibX preferences.
     *
     *    @param  {Node}       xmlNode     an XML node to load
     *    @param  {Object}     descriptor  descriptor object
     *    @config {String}     filename    (optional) filename of XML preferences file to load
     *    @config {Boolean}    overwrite   determines whether or not these
     *                                     preferences should overwrite values
     *                                     of existing preferences
     *    @config {String}     base        (optional) base within preferences
     *                                     tree where subtree should be
     *                                     inserted ( ex, "libx.prefs.browser"
     *                                     for libx.browser.contextmenu )
     */
    loadXML : function ( xmlNode, descriptor ) {
        var overwrite = descriptor.overwrite;
        var base = descriptor.base;
        
        var loadedPrefs = new prefFactory[(xmlNode.localName || xmlNode.nodeName.replace("libx:",""))]( null, base, xmlNode );

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
            
        /*
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
     *    Saves the in-memory libx.prefs object to storage.
     *    The object is saved as a serialized XML document.
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
     *    Finds and returns an entry by name.
     *    Note that this returns the object, not the value of the preference.
     *    Use {@link libx.preferences.getValue} to retrieve the value of a preference
     *
     *    @param {String} name  name of the preference object to retrieve
     *    @return {libx.preferences.XMLPreferenceObject} entry w/ specified name, or null if it doesnt exist
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
     *    the preference cannot be found.
     *
     *    @param {String} name  name of the preference to look for
     *    @param {String|Boolean|Number} defValue  value to return if the preference does not exist
     *    @returns {String|Boolean|Number} the value of the preference
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
     *    Finds and returns a preference node by ID.
     *
     *    @param {String} id  ID of the value to retrieve
     *    @return {libx.preferences.XMLPreferenceObject} entry with the
     *            specified ID, or null if it doesnt exist
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
    },

    XMLPreferenceObject: XMLPreferenceObject

}
})();
