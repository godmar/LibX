
// XXX: This needs to be made cross-browser at some point                                             
(function () {
    var gLibx = Components.classes['@libx.org/libxcomponent;1'].getService().wrappedJSObject.libx;
    libx = { };
    gLibx.core.Class.mixin(libx, gLibx, true);
})();

// Populate libx.edition, used for the context menu and about tabs
// We need this b/c configuration is loaded by each browser window, not in global space
var editionConfigurationReader = new libx.config.EditionConfigurationReader( {
            url: "chrome://libx/content/config.xml",
            onload: function (edition) {
                libx.edition = edition;
            }
    } );
    
// Get localized String Bundle
var prefsBundle = {
	bundle : new libx.locale.StringBundle("chrome://libx/locale/prefs.properties"),
	getProperty : function ( val, defaultVal ) {
		var prop = "";
		try {
			prop = this.bundle.getProperty ( val );
		} catch ( e ) {
			prop = defaultVal;
		}
		return libx.utils.xml.encodeEntities ( prop );
	}
};

var onloadFunctions = [];

$(document).ready ( function () {
	// Process the first template, which will create tabs and recursively process
	// each subsequent template
    var result = process ( libx.prefs, "libx.prefs" );

    // Clone and append to main document
    // This evaluates scripts and style sheets ( setting the innerHTML does not seem to )
    $('#content-div').append ( $( result ) );
    
    
    // Initialize any necessary code for the templates
    for ( var i = 0; i < onloadFunctions.length; i++ ) {
    	onloadFunctions[i]();
    }
    
    // Initialize the tabs
    $('.tabs-ul').tabs();
        
        
    // Initialize the trees
    $("ul.tree").checkTree({
        labelAction: "expand",
        
        /**
         *    onCheck handler called when a checkbox is checked
         *    @param obj - the li parent for the item that was checked
         *    Updates the global preferences
         */
        onCheck : function ( obj ) {
            obj.children(":checkbox.preference-checkbox").each (
                function ( i, elem ) {
                    libx.preferences.getByID ( elem.name )._setValue ( true );
                } );
        },
        
        /**
         *    onUnCheck handler called when a checkbox is checked
         *    @param obj - the li parent for the item that was checked
         *    Updates the global preferences
         */
        onUnCheck : function ( obj ) {
            obj.children(":checkbox.preference-checkbox").each (
                function ( i, elem ) {
                    libx.preferences.getByID ( elem.name )._setValue ( false );
                } );
        }
    });
    
    $(".checked,.half_checked").siblings(".arrow").click();
    
    
    // Set event handlers for checkboxes
    $(".preference-checkbox").click ( 
        function () {
            libx.preferences.getByID ( this.name )._setValue ( this.checked );
        } );
    
    // Set event handlers for radio buttons
    $(":radio").click(
        function () {
            libx.preferences.getByID ( this.name )._setValue ( this.value );
        } );

} );
    

/**
 *    Processes a template.
 *    @param pref - object to be passed into template
 *    @param layout - optional, used to specify a specific layout
 *    If layout is not specified, we will look for the template as follows
 *        1. We will look for a template matching the preferences _id attribute
 *        2. We will look for a template matching the preferences _layout attribute
 *        3. We will look for a template matching the preferences _nodeType attribute
*/
function process ( pref, layout ) {        
    var template = null;
    var filenames = [ layout ];
    if ( pref != null ) {
    	filenames.push ( pref._id );
    	filenames.push ( pref._layout );
    	filenames.push ( pref._nodeType );
    }
    
    for ( var i = 0; i < filenames.length; i++ ) {
    	if ( filenames[i] != null ) {
    		var templateText = getTemplate ( filenames[i] );
    		// getTemplate returns false if template is not found
    		if ( templateText ) {
    			var jsplate = new JsPlate ( templateText, filenames[i] );
    			return jsplate.process ( pref );
    		}
    	}
    }
    
    libx.log.write ( "Error: Unable to find template for " + filenames.toString() );
    return "";
}

/**
 *    Attempts to retrieve a template
 */    
function getTemplate ( name ) {    
	var text = libx.io.getFileText ( "chrome://libx/content/preferences/templates/" + name + ".tmpl" );
	return text;
}

/**
 *    This needs to be updated to allow for saving of int/string and multichoice prefs
 */
function save () {
    libx.preferences.save();
}