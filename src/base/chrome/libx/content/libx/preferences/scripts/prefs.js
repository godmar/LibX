var DEBUG = false;

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
	getProperty : function ( name, defaultVal ) {
		var prop = "";
		
		prop = this.bundle.getProperty ( name );
		// If an error occurs, pref returns <name>
		if ( DEBUG ) libx.log.write ( name + ", prop is: " + prop );
		if ( prop.indexOf ( "<" + name ) == 0 && defaultVal != null )
			prop = defaultVal;
			
		return libx.utils.xml.encodeEntities ( prop );
	}
};

var onloadFunctions = [];
var templateID = 42;
var globaldata = {};
$(document).ready ( function () {
	// Process the first template, which will create tabs and recursively process
	// each subsequent template
    var result = process ( libx.prefs, "libx.prefs" );

    // Clone and append to main document
    // This evaluates scripts and style sheets ( setting the innerHTML does not seem to )
    
    $('#content-div').append ( $( result ) );

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
    var base = "chrome://libxprefs/content/templates/";
    var ext = ".tmpl";
    var filenames = [  ];
    if ( layout != null )
    	( layout.indexOf ( "://" ) > 0 ) ? filenames.push ( layout ) : filenames.push ( base + layout + ext );
    if ( pref != null ) {
    	//filenames.push ( base + pref._id + ext );
    	if ( pref._layout != null ) {
    		if ( pref._layout.indexOf ( "://" ) > 0 )  
    			filenames.push ( pref._layout );
    		else
    			filenames.push ( base + pref._layout + ext );
    	} 
    	filenames.push ( base + pref._nodeType + ext );
    }


    return processTemplate ( filenames, pref );
}

/**
 *    Attempts to retrieve a template
 */    
function processTemplate ( filenames, data ) {
	var divID = "template"+templateID++;    
	if ( DEBUG )  libx.log.write ( "processing for: " + divID + "\n" + filenames.join ( "\n\t" )	);
	// store the data here so we can retrieve it later
	globaldata[divID] = data;
	
	function getTemplate () {
		var file = files.shift();
		if ( DEBUG ) libx.log.write ( "Processing file=" + file );
		/*libx.cache.defaultObjectCache.get ( { */
		libx.cache.defaultObjectCache.get({
			dataType: "text",
			url: file,
			error: function ( result, status, xhr ) {
				libx.log.write ( "Error callback for: " + divID + " w/ status: " + result );
			},
			success: function (result, status, xhr) {
				if ( DEBUG ) libx.log.write ( "Complete for: " + divID );

				if ( ( result != null )) {
					
					

					var jsplate = new JsPlate ( result, file );
					
					var tmpdiv = $("#"+divID);
					var tmpparent = $(tmpdiv).parent();
					tmpdiv.replaceWith(jsplate.process(globaldata[divID]));
					initTemplate ( tmpparent );
					
					
				} else {
					
					getTemplate ();
					if ( files.length > 0 ) {
					} else {
						libx.log.write ("Cant Find Template" );
					}
				}
			}
		} );
	}
	
	/* add in the div and script tags to support async loading of preferences
	   once script tag is inserted, it is evaluated, grabs the template, and replaces the div
	   with the evaluated template
	   setTimeout prevents window from freezing up while loading
	*/
	var htmlstr = "<div id='"+divID+"'/>\n" 
	+ "<script type='text/javascript'>\n"
	+ "(function() {\n"
	+ " var files = " + libx.utils.json.stringify ( filenames ) + ";\n"
	+ " var divID = '" + divID + "';\n"
	+   getTemplate.toString() + "\n"
	+ " setTimeout ( getTemplate, 100 );\n"
	+ " })();\n"
	+ "</script>";
	return htmlstr;
}

/**
 * Various initialization functions are executed after templates are loaded
 */
function initTemplate ( elem ) {
	// Set event handlers for checkboxes
	$(elem).find(".preference-checkbox").click ( 
	    function () {
	        libx.preferences.getByID ( this.name )._setValue ( this.checked );
	} );
	

	// Set event handlers for radio buttons
	$(elem).find(":radio").click(
	    function () {
		    libx.preferences.getByID ( this.name )._setValue ( this.value );
	} );
	    // Initialize the trees
    $(elem).find("ul.tree").checkTree({
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
    // Fix the checked state of parents of checkboxes
    $(elem).find("ul.tree :checkbox[checked]").siblings(".checked").click().click();
    // Open up to show all items that are currently checked
    $(elem).find("ul.tree .checked,.half_checked").siblings( ".arrow.collapsed").click();
			    
}
/**
 *    This needs to be updated to allow for saving of int/string and multichoice prefs
 */
function save () {
    libx.preferences.save();
}