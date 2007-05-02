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
 
libxEnv.getBoolPref = function ( prefName, defValue )
{
	return nsPreferences.getBoolPref ( prefName, defValue );
}

libxEnv.getUnicharPref = function ( prefName, defValue )
{
	return nsPreferences.getLocalizedUnicharPref ( prefName, defValue );
}

libxEnv.getIntPref = function ( prefName, defValue )
{
	return nsPreferences.getIntPref ( prefName, defValue );
}

libxEnv.setBoolPref = function ( prefName, value )
{
	return nsPreferences.setBoolPref ( prefName, value );
}

libxEnv.setUnicharPref = function ( prefName, value )
{
	return nsPreferences.setUnicharPref ( prefName, value );
}

libxEnv.setIntPref = function ( prefName, value )
{
	return nsPreferences.setIntPref ( prefName, value );
}


/*
 * initialize/record a change in preference
 * We assume 
 * - that properties are choices offered in a menupopup wrapping menuitems
 * - that the name of the property is also the id of the surrounding menupopup
 * - that the name of the value is also the id of the menuitem child reflecting the choice
 */
function recordPreference(property, value)
{
    var parent = document.getElementById(property);
    for (var i = 0; i < parent.childNodes.length; i++) {
        parent.childNodes.item(i).setAttribute('checked', parent.childNodes.item(i).getAttribute('id') == value);
    }
    libxEnv.setUnicharPref(property, value);
}

