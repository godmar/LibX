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
 *                 Nathan Baker (nathanb@vt.edu)
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * LibX toolbar extension
 *
 * Author: Annette Bailey <annette.bailey@gmail.com>
 */

/*
 * This file contains IE implementations of config functions that FireFox
 * users get for free.
 *
 * It should be included after libx.js and libx.ie.js.
 */

var libx_version = "$libxversion$";

var libxProps;    //An associative array that holds the key=value pairs


/*  getProperty
 * Gets a property from the localized definitions.properties file (as loaded
 * into libxProps). Returns null on error or if property not found.
 */
libxEnv.getProperty = function(key, args) {
    try {
        //Get the property
        var prop = libxProps[key];
        if(prop){
            //See if we need to format it
            if(args) {
                return libxEnv.formatString(prop, args);
            }
            else {
                return prop;
            }
        }
        else {
            libxEnv.writeLog("Property " + key + " doesn't exist.");
        }
    }
    catch (e) {
        libxEnv.writeLog("Config error " + e.name + ": " + e.message);
    }
    return null;
};

libxEnv.formatString = function(str, args) {
    //UNDONE: Implement formatString
    return str;
};

/*  loadProperties
 * Loads properties from the defintions.properties file into an associative
 * array. This means that this file is not dynamic: changes to the file are
 * not reflected in LibX until the next IE restart. I don't know how Firefox
 * handles it, but making it dynamic would require a lot more work.
 */
libxEnv.loadProperties = function(path) {
    libxProps = new Object();
    strProps = libxInterface.getLocaleStrings();
    var m = strProps.match(/([^=\r\n]+)=(.+)$/gm);
    for(var i = 0; i < m.length; ++i) {
        var mi = m[i];
        if(mi.charAt(0) == '#') {
            continue;
        }
        var kvmatch = mi.match(/([^=]+)=(.+)$/);
        libxProps[kvmatch[1]] = kvmatch[2];
    }
};
