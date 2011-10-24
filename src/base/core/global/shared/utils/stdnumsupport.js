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
 * @fileoverview Utilities for dealing with ISBNs/ISSNs and DOIs
 */

/**
 * Checks whether a string is a DOI by seeing if it matches 10.(.*)/(.*) followed
 * by whitespace.
 *
 * Ignores doi: prefix
 *
 * @returns {String} null if the string doesn't appear to be a DOI, else the DOI.
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
};

/**
 * ISBN/ISSN utility routines
 * @namespace
 */
(function () {

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

/**
 * isISBN
 * takes a text that may contain a ISBN or EAN, possibly including hyphens.
 *
 * If convertEANtoISBN is true, convert EAN to ISBN by 
 * extracting digits 4-12 and recomputing the checkdigit
 *
 * @returns {String} null if string does not an ISBN, else returns
 *          ISBN (possibly converted)
 */
libx.utils.stdnumsupport.isISBN = function (/**String*/s, /**Boolean*/ convertEANtoISBN) {
    var ean = eanChecksum(s, /97[89]\d{10}/, /^ISBN/i);
    if (ean) {
        if (convertEANtoISBN) {
            var isbn = ean.substring(3, 12);
            return isbn + computeMod11CheckDigit(isbn);
        }
        return ean;
    }
    // else try old-style ISBN
    return mod11Checksum(s, /\d{9}[\dX]/i, /^ISBN/i);
}

/**
 * isISSN
 * takes a text that may contain a ISSN, possibly including hyphens,
 * and retrieves the ISSN from it
 *
 * @returns {String} null if string does not an ISSN, else returns
 *          ISSN in normal form 0000-0000
 */
libx.utils.stdnumsupport.isISSN = function (/**String*/ s) {
    var issn = mod11Checksum(s, /\d{7}[\dX]/i, /^ISSN/i);
    if (issn) {
        return issn.substring(0, 4) + "-" + issn.substring(4, 8);
    }
    return issn;
}
})();

// vim: ts=4
