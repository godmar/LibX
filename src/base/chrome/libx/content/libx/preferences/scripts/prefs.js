$.ajaxSetup ( { async: false } );
                                             
(function () {
    var gLibx = Components.classes['@libx.org/libxcomponent;1'].getService().wrappedJSObject.libx;
    libx = { };
    gLibx.core.Class.mixin(libx, gLibx, true);
})();

// Populate libx.edition, used for the context menu and about tabs
var editionConfigurationReader = new libx.config.EditionConfigurationReader( {
            url: "chrome://libx/content/config.xml",
            onload: function (edition) {
                libx.edition = edition;
            }
    } );
    
// Get localized String Bundle
var stringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"]  
            .getService(Components.interfaces.nsIStringBundleService);
var bundle = stringBundleService.createBundle("chrome://libx/locale/prefs.properties");

libx.stringbundle = {    
    getLocalizedString : function ( name, def ) {
        try {
            return bundle.GetStringFromName (name);
        } catch ( e ) {
            libx.log.write ( "Warning: No defined string for - " + name + ", using " + def + " instead" );
            return def;
        } 
    }
};

$(document).ready ( function () {

    var prefs = libx.prefs;
    var result = process ( libx.prefs, "libx.prefs" );
    
    $('#content-div')[0].innerHTML = result;
    $('.tabs-ul').tabs();
        
        
    // tree initialization
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
    
    $(".preference-checkbox").click ( 
        function () {
            libx.preferences.getByID ( this.name )._setValue ( this.checked );
        } );
        
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
    
    // try to get by layout paramater if it is specified
    if ( layout != null ) {
        template = getTemplate ( layout );
    }
    
    // If that fails, try to get it by id
    if ( template == null ) {
        template = getTemplate ( pref._id );
    }
    
    // If that fails, try to get it by layout attribute
    if ( template == null ) {
        template = getTemplate ( pref._layout );
    }
    
    // If that fails, try to get by node type attribute
    if ( template == null ) {
        template = getTemplate ( pref._nodeType );
    }
    
    if ( template == null ) {
        alert ( "ERROR: Cannot find template for : " + pref._nodeType + " " + pref._name );
    }
    
    var jsplate = new JsPlate ( template );
    return jsplate.process ( pref );    
}

/**
 *    Attempts to retrieve a template
 */    
function getTemplate ( name ) {
    var templateXHR = $.ajax ( {
        url : "templates/" + name + ".tmpl"
    });
    
    if ( templateXHR.status == '404' || templateXHR.responseText == "" ) {
        return null;
    }
    
    return templateXHR.responseText;
}

/**
 *    This needs to be updated to allow for saving of int/string and multichoice prefs
 */
function save () {
    libx.preferences.save();
}