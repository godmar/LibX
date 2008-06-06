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
 * Contributor(s): Tobias Wieschnowsky (frostyt@vt.edu)
 *
 * ***** END LICENSE BLOCK ***** */


//=============================================================================
// libxEnv.hash
// function set used to create hashings for urls that later get transformed into 
// file paths. Using Sha1 hash
//=============================================================================
//
// FF only
//

libxEnv.hashClass = function()
{
    var unicodeConverter = 
        Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
        createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
    unicodeConverter.charset = "UTF-8";
    var sha1Hasher = Components.classes[
        "@mozilla.org/security/hash;1"].createInstance(
        Components.interfaces.nsICryptoHash);
    
    // converts the toConvert paramater into a hexstring
    function toHexString( toConvert ) {
        return ("0" + toConvert.toString(16)).slice(-2);
    }
    
    // hashes the given text into a sha1 hashing
    this.hashString = function ( text )
    {
        var result = {};
        var data = unicodeConverter.convertToByteArray(
            text, result );
        sha1Hasher.init( sha1Hasher.SHA1 );
        sha1Hasher.update( data, data.length );
        var hash = sha1Hasher.finish( false );
        var tmp_array = new Array();
        for ( var i = 0; i < hash.length; i++ )
        {
            tmp_array[i] = toHexString( hash.charCodeAt(i) );
        }
        return tmp_array.join("");
    }
}

libxEnv.hash = new libxEnv.hashClass();
