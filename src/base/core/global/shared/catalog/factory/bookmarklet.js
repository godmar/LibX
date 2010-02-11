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

/**
 * 	Support generic "bookmarklet" style searches
 * 	The id's %t, %jt etc. in the URL are being replaced with the entered terms
 *	@name libx.catalog.factory.bookmarklet
 *	@constructor
 *	@augments libx.catalog.Catalog
 */
libx.catalog.factory["bookmarklet"] = libx.core.Class.create( libx.catalog.Catalog, 
	 /** @lends libx.catalog.factory.bookmarklet.prototype */{
	 
    makeSearch: function (/**String*/ stype, /**String*/ sterm) {
        return this.makeAdvancedSearch([{searchType: stype, searchTerms: sterm}]);
    },
    
    makeAdvancedSearch: function (/**[{searchType: {String}, searchTerms: {String}}]*/fields) {
        var usePost = this.postdata != null;
        if (usePost) {
            var argtemplate = this.postdata;
        } else {
            var argtemplate = this.url;
        }

        /* Example of URL that uses %SWITCH statement and %termN:
            url="http://www.lib.umich.edu/ejournals/ejsearch.php?searchBy=%SWITCH{%type1}{t:KT}{d:KS}{sot:TV}{soi:IV}&AVterm1=%term1&Cnect2=AND&AVterm2=%term2&Cnect3=AND&AVterm3=%term3&New=All&submit=Find"
        */
        var swtch;
        var swtchre = /%SWITCH\{(%[a-z0-9]+)\}\{(([^}]+(\}\{)?)+)}/i;
        while ((swtch = argtemplate.match(swtchre)) != null) {
            var s = swtch[1];
            var repl = "";
            var caseargs = swtch[2].split("}{");
            var m = s.match(/^%type(\d+)/);
            var switch_arg = null;
            if (m) {
                if (m[1] <= fields.length)
                    switch_arg = fields[m[1] - 1].searchType;
            } else {
                m = s.match(/^%term(\d+)/);
                if (m) {
                    if (m[1] <= fields.length)
                        switch_arg = fields[m[1] - 1].searchTerms;
                } else
                    libx.log.write("invalid switch_arg '" + s + "', must be %termX or %typeX");
            }
            for (var i = 0; switch_arg != null && i < caseargs.length; i++) {
                var re = new RegExp("^" + switch_arg + ":(\\S*)$");
                var m = re.exec(caseargs[i]);
                if (m) {
                    repl = m[1];
                    break;
                }
            }
            argtemplate = argtemplate.replace(swtchre, repl);
        }

        // replace %termN with corresponding search terms
        for (var i = 0; i < fields.length; i++) {
           argtemplate = argtemplate.replace("%term" + (i+1), encodeURIComponent(fields[i].searchTerms), "g");
        }
        // clear out remaining %termN
        argtemplate = argtemplate.replace(/%term\d+/g, "");

        // combine all search fields that share same type
        var searchField2Term = this.combineSameTypedFields(fields);

        /*
         * Process JOIN statement has the form %JOIN{JOINEXPR}{code|VALUE with %code}*
         * Replaces {code|VALUE with %code} with either empty (if %code is not included)
         * or to "VALUE with %code" if not.  Uses "JOINEXPR" as a connector a la 'join'.
         * Example:
         *
         * options="Y;t;a" 
         * url="http://ezproxy.lib.vt.edu:8080/login?url=http://firstsearch.oclc.org/dbname=WorldCat;FSIP;query=%JOIN{%20and%20}{Y|kw%3A%Y}{t|ti%3A%t}{a|au%3A%a}" 
         */
        var join;
        var joinre = /%JOIN{(([^}]+(\}\{)?)+)}/i;
        while ((join = argtemplate.match(joinre)) != null) {
            var caseargs = join[1].split("}{");
            var joiner = caseargs[0];
            var repl = "";
            for (var i = 1; i < caseargs.length; i++) {
                var ca = caseargs[i].split("|");
                if (searchField2Term[ca[0]]) {
                    if (repl != "")
                        repl += joiner;

                    repl += ca[1];
                }
            }
            argtemplate = argtemplate.replace(joinre, repl);
        }

        // replace %X with terms
        for (var stype in searchField2Term) {
           argtemplate = argtemplate.replace("%" + stype, encodeURIComponent(searchField2Term[stype]));
        }

        // clear out other %values if defined
        for (var option in libx.edition.searchoptions) {
            // to allow %is, %i, and %issue require that label be followed by a non-letter
            // XXX not very robust.
            argtemplate = argtemplate.replace(new RegExp("%" + option + "(?![a-zA-Z0-9])"), "", "g");
        }

        if (usePost) {
            return [ this.url, argtemplate ];
        } else {
            return argtemplate;
        }
    }
});
