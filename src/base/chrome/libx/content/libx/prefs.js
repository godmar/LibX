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
 * This file contains the logic for storing/retrieving *menu preferences*.
 * All other preferences are still stored using prefs.*.js.
 */

libxEnv.defaultPrefs = "chrome://libx/content/defaultprefs.xml"
libxEnv.userPrefs = "userprefs.xml";

function libxXMLPreferences () {
    this.path = libxEnv.userPrefs;
    this.init();
}

libxXMLPreferences.prototype = {
    serialize: function () {
        return this.serializeObjectHelper ( this, "" );
    },
    serializeObjectHelper: function ( o, offset ) {
        if ( !offset )
            offset = "";
        // see http://codingforums.com/archive/index.php?t-60777.html
        var typename = o.nodeName;
        var s = offset + "<" + typename;
        for (var k in o.attr) {
            s += " " + k + '="' + o.attr[k] + '"';
        }
        if ( !o.children || o.children.length == 0  ) {
            s += "/>\n";
        }
        else {
            s += ">\n";
            for (var i = 0; i < o.children.length; i++) {
                s += this.serializeObjectHelper(o.children[i], offset + "    " );
            }
            s+= offset + "</" + typename + ">\n";
        }
        return s;
    
    },
    /*
     * Loads XML into this javascript object
     */
    init : function () {
        // First see if we can get the user preferences
        var doc = libxEnv.getLocalXML ( this.path );
        if ( doc ) {
            this.loadXMLhelper ( doc.firstChild, this );
        }
        else {
            // If not, we fall back to defaults (but path is still user prefs)
            doc = libxEnv.getLocalXML(libxEnv.defaultPrefs);
            if(doc) {
                this.loadXMLhelper(doc.firstChild, this);
            }
            else {
                // OK, I guess it's time to fail
                libxEnv.writeLog ("Context menu file at " + this.path + " not found (and could not fall back).");
            }
        }
    },
    
    loadXMLhelper: function ( parentNode, parentObj ) {
        // Fix for differing IE and Firefox interpretations of
        // "firstChild" when the document contains an xml version specifier
        if(parentNode.nodeName.toLocaleLowerCase() == 'xml') {
            parentNode = parentNode.nextSibling;
        }
        /* Load parents attributes */
        this.copyAttributes ( parentNode, parentObj );
    
        parentObj.children = new Array();
        for ( var i = 0; parentNode.childNodes && i < parentNode.childNodes.length; i++ ) {
            var child = new Object();
    
            var name = parentNode.childNodes[i].nodeName;
            if ( name && name != "#text" ) {
    
                this.loadXMLhelper ( parentNode.childNodes[i], child );
        
                parentObj.children.push ( child );
                
                if ( !parentObj[name] ) {
                    parentObj[name] = child;
                }
                else if ( parentObj[name].length > 1 ) {
                    parentObj[name].push ( child );
                }
                else { // Create a array
                    var childArray = new Array();
                    childArray.push ( parentObj[name] );
                    childArray.push ( child );
                    parentObj[name] = childArray;
                }   
            }
        }   
    },
    
    /*
     * Copies all attributes from a node to the object
     */
    copyAttributes : function ( node, object ) {
        if ( !object.attr )
            object.attr = new Array();
        object.nodeName = node.nodeName;
        for (var i = 0; node.attributes && i < node.attributes.length; i++) {
            var attr = node.attributes[i];
            object.attr[attr.nodeName] = libxNormalizeOption(attr.nodeValue);
        }
    },
    save: function () {
        libxEnv.writeToFile ( this.path, this.serialize() );
    }
}
