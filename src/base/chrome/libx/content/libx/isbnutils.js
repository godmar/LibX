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
 * ISBN/ISSN utility routines
 */

// should we convert EAN to ISBN by extracting digits 4-12 and recomputing the checkdigit?
var convertEANtoISBN = nsPreferences.getBoolPref("libx.isbnutils.converteantoisbn", true);

/* isISBN
 * takes a text that may contain a ISBN, possibly include hyphens
 * returns null if no ISBN was found
 * else returns the found ISBN as a string
 */
function isISBN(s) {
    var ean = eanChecksum(s, /97[89]\d{10}/, /^ISBN/i);
    if (ean) {
        if (convertEANtoISBN) {
            var isbn = ean.substring(3, 12);
            return isbn + computeMod11CheckDigit(isbn);
        }
        return ean;
    }
    // else try old-style ISBN
    return mod11Checksum(s, /\d{9}[\dX]/, /^ISBN/i);
}

/* isISSN
 * takes a text that may contain a ISSN, possibly include hyphens
 * returns null if no ISSN was found
 * else returns the found ISSN as 0000-0000
 */
function isISSN(s) {
    var issn = mod11Checksum(s, /\d{7}[\dX]/, /^ISSN/i);
    if (issn) {
        return issn.substring(0, 4) + "-" + issn.substring(4, 8);
    }
    return issn;
}

// compute the Mod 11 check digit, pass in string WITHOUT check digit
function computeMod11CheckDigit(s) {
    var n = s.length;
    var chksum = 0;
    for (var i = 0; i < n; i++) {
        chksum += (n + 1 - i) * s.charAt(i);
    }
    chksum = (chksum % 11 == 0) ? 0 : (11 - chksum % 11);

    if (chksum == 10) {
        return "X";
    } else {
        return chksum + "";
    }
}


// helper function
// following: http://www.computalabel.com/isbn.html
function mod11Checksum(s, regx, removeprefix) {
    s = s.replace(/[#:\-\s\.]/g, "").replace(removeprefix, "");

    var m = s.match(regx);
    if (m == null) {
        return null;
    }

    s = m[0];
    var n = s.length;
    var mustdigit = computeMod11CheckDigit(s.substring(0, n-1));
    var hasdigit = s.charAt(n-1).replace(/x/i, "X");

    if (mustdigit == hasdigit) {
        return s;
    }
    return null;
}

function eanChecksum(s, regx, removeprefix) {
    s = s.replace(/[#:\-\s\.]/g, "").replace(removeprefix, "");

    var m = s.match(regx);
    if (m == null) {
        return null;
    }

    s = m[0];
    var n = s.length;
    var chksum = 0;
    for (var i = 0; i < n-1; i++) {
        chksum += s.charAt(i) * ((i % 2 == 0) ? 1 : 3);
    }

    chksum = (chksum % 10 == 0) ? 0 : (10 - chksum % 10);
    var chkdigit = parseInt(s.charAt(n-1));

    if (chksum == chkdigit) {
        return s;
    }
    return null;
}

// vim: ts=4

