
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
            for (var i =0; i < o.children.length; i++) {
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
                libxEnv.writeLog (this.path + " not found.", "Preferences");
            }
        }
    },
    
    loadXMLhelper: function ( parentNode, parentObj ) {
        // Fix for differing IE and Firefox interpretations of
        // "firstChild" when the document contains an xml version specifier
        if(parentNode.nodeName == 'xml') {
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
            object.attr[attr.nodeName] = libxConvertToBoolean(attr.nodeValue);
        }
    },
    save: function () {
        libxEnv.writeToFile ( this.path, this.serialize() );
    }
}
