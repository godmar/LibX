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

(function () {

/**
 *	Helper function that creates an item descriptor with specified
 *	searchType for every openurl object in the edition
 */
function createResolverItemDescriptors ( edition, searchType ) {
	var items = new Array();
	for ( var i = 0; i < edition.openurl.length; i++ ) {
		var resolver = edition.openurl[i];
		items.push ( { type: 'openurl', args: { name: resolver.name, searchType: searchType } } ); 
	}
	return items;

}


/**
 *	This is the object passed when a new ContextMenu object is initialized
 *	It defines and populates the base GroupLists and Groups for the ContextMenu
 *
 *	Format for this object is as follows:
 *	
 *	GroupListDescriptor
 *	{
 *		name: {String} - Name of this GroupList
 *		type: {GroupList.type} - Defines the type of this group list
 *		groups: {Array} Array of GroupDescriptor objects
 *	}
 *
 *	GroupDescriptor = 
 *	{
 *		name: {String} Name of this group
 *		match: {Function} Match function, should take a PopupHelper
 *		populate: {Function} Function to populate the context menu, should take a
 *				             EditionConfiguration object
 *		
 *		[REQUIRESTEXTSELECTED]: {Boolean} If true, will only call the match function
 *											if text is selected, defaults to false if
 *											undefined
 *	}
 *
 */ 
libx.ui.basicContextMenuDescriptor = [
	{ name: 'libx', 
		type : libx.ui.ContextMenu.GroupList.type.STOP_AT_FIRST_MATCHING_GROUP,
		groups : [
			{ name: 'issn',
				REQUIRESTEXTSELECTED: true,
				match: function (p) { 
                	return libx.utils.stdnumsupport.isISSN(p.getSelection());  
        		},
	        	/**
	        	 *	Creates an item descriptor for every:
	        	 *		catalog that supports 'i' searchType
	        	 *		resolver
	        	 */
        		createItemDescriptors: function (edition) {
        			var items = new Array();
        			for ( var i = 0; i < edition.catalogs.length; i++ ) {
        				var catalog = edition.catalogs[i];
        				
						if ( catalog.supportsSearchType ( 'i' ) ) {
        					items.push ( { type: 'catalog', args: { name: catalog.name, searchType: 'i' } } );
        				}
        			}
        			
        			items.concat ( createResolverItemDescriptors ( edition, 'i' ) );
        			return items;
        		}
        	},
			{ name: 'isbn',
				REQUIRESTEXTSELECTED : true,
				match : function (p) {
            	// can't downconvert ISBN 13 here since we don't know if catalog requires it
                	return libx.utils.stdnumsupport.isISBN(p.getSelection()); 
        		},
        		/**
	        	 *	Creates an item descriptor for every:
	        	 *		catalog that supports 'i' searchType
	        	 *		catalog with xisbn enabled
	        	 *		resolver
	        	 */
        		createItemDescriptors: function ( edition ) {
        			var items = new Array();
        			for ( var i = 0; i < edition.catalogs.length; i++ ) {
        				var catalog = edition.catalogs[i];
        				if ( catalog.supportsSearchType ( 'i' ) ) {
        					items.push ( { type: 'catalog', 
        						args : { name: catalog.name, searchType: 'i' } 
        					} );
        				}
        				if ( catalog.xisbn && ( catalog.xisbn.opacid ||  catalog.xisbn.oai ) ) {
         				  	items.push ( { type: 'catalog', args: 
         				  		{ name : catalog.name, searchType: 'xisbn' } 
         				  	} );
       					}
        			}
        			items.concat ( createResolverItemDescriptors ( edition, 'i' ) );
        			return items;
        		}
        	},
        	{ name: 'pmid',
        		REQUIRESTEXTSELECTED : true,
        		match : function (p) { 
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
        		},
        		/**
	        	 *	Creates an item descriptor for every:
	        	 *		resolver
	        	 */
        		createItemDescriptors : function ( edition ) {
        			return createResolverItemDescriptors ( edition, 'pmid' );
        		}
        	},
			{ name : 'doi',
				match : function isDOIF ( p ) {
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
		   		/**
	        	 *	Creates an item descriptor for every:
	        	 *		resolver
	        	 */
		   		createItemDescriptors : function ( edition ) {
		   			return createResolverItemDescriptors ( edition, 'doi' );
		   		}
		   	},
			{ name : 'general',
				match : function isTextSelected ( p ) {
			        var sterm = p.getSelection();
			        if ( !sterm )
			            return null;
			        // clean up search term by removing unwanted characters
			        // should leave &, and single apostrophe in - what about others?
			        // and replaces multiple whitespaces with a single one
			        // use :alnum: to avoid dropping diacritics and other Unicode alphanums
			        // as per Ted Olson
			        return sterm.replace(/[^[:alnum:]_&:\222\'\-\s/g, " ").replace(/\s+/g, " ");
    			},
    			/**
	        	 *	Creates an item descriptor for every:
	        	 *		searchType of a catalog != 'i'
	        	 *		Google Scholar magicsearch
	        	 */
    			createItemDescriptors : function ( edition ) {
    				var items = new Array();
    				for ( var i = 0; i < edition.catalogs.length; i++ ) {
    					var catalog = edition.catalogs[i];
						var options = catalog.options.split(';');
						for ( var k = 0; k < options.length; k++ ) {
							var searchOption = options[k];
							if ( searchOption != '' && searchOption != 'i' ) {
									items.push ( 
										{ type: 'catalog', args: 
											{ name : catalog.name, searchType: searchOption } }
									);
							}
						}
					}
					items.push ( { type: 'scholar' } );
					return items;
	    		}
    		}
    	]		
	},
	{ name : 'always',
		type : libx.ui.ContextMenu.GroupList.type.INCLUDE_ALL_GROUPS,
		groups : [
			{ name : 'proxy',
				match : function isProxyActive( p ) {
			        if (libx.edition.proxy.default)
			            return p;
			        else
			            return null;
		    	},
		    	/**
	        	 *	Creates an item descriptor for every:
	        	 *		proxy
	        	 */
		    	createItemDescriptors : function ( edition ) {
		    		var items = new Array();
		    		for ( var i = 0; i < edition.proxy.length; i++ ) {
		    			var proxy = edition.proxy[i];
		    			items.push ( { type: 'proxy', args : { name: proxy.name } } );	
		    		}
		    		return items;
		    	}
		    }	
		]
	}
];
        
} )();
// vim: ts=4 sw=4
