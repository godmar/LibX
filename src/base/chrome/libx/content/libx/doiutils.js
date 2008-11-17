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
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * @fileoverview Utilities for dealing with DOIs
 */

/**
 * Checks whether a string is a DOI by seeing if it matches 10.(.*)/(.*) followed
 * by whitespace.
 *
 * Ignores doi: prefix
 *
 * @return {String} null if the string doesn't appear to be a DOI, else the DOI.
 */
libx.utils.stdnumsupport.isDOI = function (/**String */str) {
    var s = str.replace(/\s*doi:?\s*/i, "");

    // If the DOI is encoded as URI, restrictions apply as follows:
    // var m = s.match(/10\.[A-Za-z0-9\-_\.!~*'()]+\/[A-Za-z0-9\-_\.!~*'()]+/);
    // See 2.3 in http://www.ietf.org/rfc/rfc2396.txt

    // DOIs according to Z39.84 DO NOT have a self-limiting end character.
    // See http://www.niso.org/standards/resources/Z39-84-2000.pdf
    // any unicode character can be in the prefix or suffix
    // so we take in all non-whitespace characters - assuming that fews DOIs 
    // will contain those.
    var m = s.match(/10\.\S+\/\S+/);

    if (m)
        return m[0];
    return null;
}

// vim: ts=4
