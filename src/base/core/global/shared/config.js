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
 *                 Mike Doyle (vtdoylem@gmail.com)
 *                 Nathan Baker (nathanb@vt.edu)
 * 
 * ***** END LICENSE BLOCK ***** */

/*
 * LibX toolbar extension
 *
 * Author: Annette Bailey <annette.bailey@gmail.com>
 */ 

/**
 * @fileoverview
 *
 * This file contains functionality that works in all browsers
 * related to configuration, properties, and localization.
 */
 
/**
 * Support for reading LibX configurations.
 *
 * See http://libx.org/xml/libxconfig.dtd for a DTD describing the 
 * configuration options.  
 *
 * @namespace
 */
libx.config = { };

/**
 * A convenience mixin that provides a 'getByName' function to
 * find items by name.  Used for libx.editions.catalogs, openurl, and proxy
 * to find catalogs, openurls, and proxy by their name (where necessary).
 */
libx.config.NameableItemArray = {
    getByName : function ( name ) {
        for ( var i = 0; i < this.length; i++ ) {
            if ( this[i].name == name )
                return this[i];
        }
        return null;
    }
};

// vim: ts=4
