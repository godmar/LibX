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

libxEnv.getBoolPref = function ( prefName, defValue )
{
    return libxInterface.Preferences.getBoolPref(prefName, defValue);
}

libxEnv.getUnicharPref = function ( prefName, defValue )
{
    return libxInterface.Preferences.getUnicharPref(prefName, defValue);
}

libxEnv.getIntPref = function ( prefName, defValue )
{
    return libxInterface.Preferences.getNumericPref(prefName, defValue);
}

libxEnv.setBoolPref = function ( prefName, value )
{
    libxInterface.Preferences.setBoolPref(prefName, value);
}

libxEnv.setUnicharPref = function ( prefName, value )
{
    libxInterface.Preferences.setUnicharPref(prefName, value);
}

libxEnv.setIntPref = function ( prefName, value )
{
    libxInterface.Preferences.setNumericPref(prefName, value);
}

/*
 * 	initializePreferences
 * This function, like recordPreference, is rendered unnecessary in IE. This
 * is because the toolbar manages the preferences (rather than the
 * javascript), so there is no reason to explicitly tell the toolbar about
 * preferences it needs to know about.
 */
libxEnv.libxInitializePreferences = function (property)
{
}

libxEnv.getLocalXML = function ( path ) {
    return libxInterface.getXMLPrefFile(path);
}

libxEnv.writeToFile = function ( path, str ) {
    return libxInterface.writeToFile(path, str);
}
