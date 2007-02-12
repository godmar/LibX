
/*
 * Utility Functions for the Context MenuObjects
 *
 */
 
// Holds all the menu items
var LibxMenuItems = new Array();

// Holds all the unique labels
var LibxLabels = new Array();

/*
 * MenuObject class
 * Stores all info required about the menu item
 * Has the following fields:
 * this.menuitems[] -- array of menuitems with properties
 *                     Common properties include id, label, hidden, and oncommand
 * this.matchf -- matching function ( generally a regular expression, that
 *                will return a non null result when a match is found )
 * this.commf -- command function to be run when the match is found.
 *               this function is passed in the menuitems as well as the
 *               result from the matchf
 */
function MenuObject ( menuitems, tmatch, comm ) {

  var contMenu = document.getElementById("contentAreaContextMenu");
  this.menuitems = new Array();
  for ( var i = 0; i < menuitems.length; i++ ) {
		var newMenuItem = document.createElement ( "menuitem" );
		var menuProps = menuitems[i];
		for ( var k in menuProps ) {
			newMenuItem.setAttribute (k, menuProps[k]); // a['j'] == a.j 
		}
		this.menuitems.push ( newMenuItem );

		contMenu.insertBefore ( newMenuItem, document.getElementById ( "libx-proxify" ) );
	}
	
	this.matchf = tmatch;
	this.commf = comm;
}
	
	

/* Creates a new Context Menu Object
 * menuitems -- array of menuitems to create ( ie [{id:"libx-pmid-search", hidden:"true", oncommand:"doPmidSearch();"}] )
 *
 * label     -- used to determine order of evaluation
 * 				anything with "DEFAULT" as label will always be evaluated
 *
 * tmatch    -- function that takes a popuphelper ( see popuphelperutils.js for documentation ) and returns
 *              null - if no match is found and menuObject(s) should not be displayed
 *              otherwise the comm function will be called..
 *
 * comm      -- function that is called if a non-null match is found
 *				is given two paramaters 
 *					s -- the match returned by tmatch function
 *                  menuItems -- an array of the actual menu items that were created from the data given by menuitems param
 */
function ContextMenuObject ( menuitems, label, tmatch, comm ) {
    var menuObject = new MenuObject ( menuitems, tmatch, comm );
    
	if ( !LibxMenuItems[label] ) // if the label hasnt been previously used, intialize it
	{
		LibxLabels.push ( label );
		LibxMenuItems[label] = new Array();
	}
	
	LibxMenuItems[label].push ( menuObject );
}



// Function that is run if there is text selected and context menu is requested
// p = popuphelper
function ContextMenuShowing( p ) {

	for ( var k = 0; k < LibxLabels.length; k++ ) {
		var CMO = LibxMenuItems[LibxLabels[k]];			// get the group of menu items!
		var keepGoing = true;				// quit if we need to
		
		for (var i = 0; i < CMO.length; i++) {
            
			var menuObj = CMO[i].menuitems; // hidden by default
			for ( var j = 0; j < menuObj.length; j++ ) {
				menuObj[j].hidden = true;
			}
			
			if ( keepGoing ) { // only unhide if nothing else has been unhidden
				var m = CMO[i].matchf( p );   // if it matches
				
	            if ( m ) {
		            CMO[i].commf( m, menuObj );	            	// call the function
		            
	        		if ( k != 0 ) { // if the label isnt default, then stop!
		        		keepGoing = false;
	        		}
	            }
        	}
	    }
	}		
}
