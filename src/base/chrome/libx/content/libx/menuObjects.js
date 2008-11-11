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

// Add flags ( ie, REQUIRESTEXTSELECTED )
// Use array instead of object

// This probably needs to be moved
libx.ui.contextMenuTemplate = {
	libx : {
		type : libx.ui.ContextMenu.GroupList.types.STOP_AT_FIRST_MATCHING_GROUP,
		groups : {
			issn : {
				REQUIRESTEXTSELECTED: true,
				
				match: function (p) { 
            if (p.isTextSelected()) 
                return isISSN(p.getSelection()); 
            else 
                return null; 
        },
	        	// 
        		populate: function (edition) {
        				
        			}
        		},
			isbn : function (p) {
            	// can't downconvert ISBN 13 here since we don't know if catalog requires it
            if (p.isTextSelected()) 
                	return isISBN(p.getSelection()); 
            else 
                return null; 
        },
        	pmid : function (p) { 
            	if (p.isTextSelected()) {
                	var s = p.getSelection(); 
                	if ( libx.edition.openurl.length > 0 ) {
            var m = s.match(/PMID[^\d]*(\d+)/i);
            if (m != null) {
                return m[1];
            }
            m = s.match(/PubMed\s*ID[^\d]*(\d+)/i);
            if (m != null) {
                return m[1];
            }
        }
    }
            	else 
            	    return null; 
        	},
			doi : function isDOIF ( p ) {
        		if (libx.edition.openurl.length == 0) {
            return null;
        }
        if (p.isOverLink()) {
            //does href of hyperlink over which user right-clicked contain a doi?
            return isDOI(decodeURI(p.getNode().href));
        } else 
        if (p.isTextSelected()) {
            return isDOI(p.getSelection());
        }        
        return null;
    		},
			general : function isTextSelected ( p ) {
        var sterm = p.getSelection();
        if ( !sterm )
            return null;

        // clean up search term by removing unwanted characters
        // should leave &, and single apostrophe in - what about others?
        // and replaces multiple whitespaces with a single one
        // use :alnum: to avoid dropping diacritics and other Unicode alphanums
        // as per Ted Olson
        return sterm.replace(/[^[:alnum:]_&:\222\'\-\s/g, " ").replace(/\s+/g, " ");
    }
    }
	},
	always : {
		type : libx.ui.ContextMenu.GroupList.types.INCLUDE_ALL_GROUPS,
		groups : {
			proxy : function isProxyActive( p ) {
        if (libx.edition.proxy.default)
            return p;
        else
            return null;
    }
            }
        }
};
        

// vim: ts=4 sw=4
