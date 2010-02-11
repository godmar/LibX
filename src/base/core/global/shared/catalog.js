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
 * LibX toolbar extension
 *
 * Author: Annette Bailey <annette.bailey@gmail.com>
 */ 
 
 /**
  *	@fileoverview Implementation of LibX core Catalog classes
  *		Implements Catalog, bookmarklet, and scholar
  *	@author Annette Bailey <annette.bailey@gmail.com>
  *	@author Godmar Back <godmar@gmail.com>
  */

/** @namespace All catalog class definitions reside in this namespace */
libx.catalog = { 
    /**
     *	Used to instantiate the various catalog types
     *	All catalog types are accessed by there lowercase class names
     *	@namespace
     *	@example
     *		var alephCatalog = new libx.factory["aleph"] ()
     */
    factory : { }
};

/**
 *	Mixin used by catalogs and openurl resolvers
 * @class
 */
libx.catalog.CatalogUtils = {

    /* If the searchType is 'i', examine if user entered an ISSN
     * and if so, change searchType to 'is'.  This ensures that 'i' handles
     * both ISBNs and ISSNs.
     */
    adjustISNSearchType : function (f)
    {
        // if this is an ISSN, but not a ISBN, change searchType to 'is'
        if (f.searchType == 'i') {
            if (!libx.utils.stdnumsupport.isISBN(f.searchTerms) && libx.utils.stdnumsupport.isISSN(f.searchTerms)) {
                f.searchType = 'is';
            }
        }
    }
};
