
var templateBundle = null;

var templateID = 0;
var base = libx.locale.getBootstrapURL("preferences/templates/");
var ext = ".tmpl";

$(document).ready ( function () {

    // the following conditions must be true for a template to be processed:
    //   1) the placeholder for the template exists in the DOM
    //   2) the template's locale has been fetched
    //   3) the template file itself has been fetched
    
    // this is an array of "blockers"; each element in the array is the first
    // element of a different activity queue
    var aQueues = [];
    
    // Process the first template, which will create tabs and recursively process
    // each subsequent template
    var result = process ( aQueues, libx.prefs, "libx.prefs" );

    // Clone and append to main document
    // This evaluates scripts and style sheets ( setting the innerHTML does not seem to )
    
    $('#content-div').append ( $( result ) );
    
    // the template placeholder now exists in the DOM
    aQueues[0].markReady();
    
    // Set event handlers for textboxes
    $(".preference-text").live("change", function () {
        libx.preferences.getByID ( this.name )._setValue ( this.value );
        libx.preferences.save();
    } );

    // Set event handlers for checkboxes
    $(".preference-checkbox").live("click", function () {
        libx.preferences.getByID ( this.name )._setValue ( this.checked );
        libx.preferences.save();
    } );
    
    // Set event handlers for multichoice preferences
    $(".preference-multichoice").live("click", function () {
        libx.preferences.getByID ( this.name )._selected = this.checked;
        libx.preferences.save();
    } );

    // Set event handlers for radio buttons
    $(".preference-radio").live("click", function () {
        libx.preferences.getByID ( this.name )._setValue ( this.value );
        libx.preferences.save();
    } );
    
} );
   
/**
 *    Processes a template.
 *    @param aQueues - array for adding activity queues
 *    The activity queues added to this array will delay processing until these
 *    activities have completed:
 *        1. The template's placeholder is added to the DOM
 *        2. The template's localization has been fetched and processed
 *        3. The template itself has been fetched
 *    This function returns the template placeholder, meaning it is the caller's
 *    responsibility to add it to the DOM and mark activity #1 ready.
 *    @param pref - object to be passed into template
 *    @param layout - optional, used to specify a specific layout
 *    If layout is not specified, we will look for the template as follows
 *        1. We will look for a template matching the preferences _layout attribute
 *        2. We will look for a template matching the preferences _nodeType attribute
 *    @param data - any additional data given to a child template by its parent
*/
function process( aQueues, pref, layout, data ) {
    
    var templateFile = null;
    
    // find corresponding layout in order described above
    if ( layout )
        templateFile = layout;
    else if ( pref._layout )
        templateFile = pref._layout;
    else
        templateFile = pref._nodeType;
        
    // convert template names to absolute URLs
    if ( templateFile.indexOf ( "://" ) == -1)
        templateFile = base + templateFile + ext;
        
    var divID = "template" + templateID++;    
    
    // libx.log.write ( "Processing div id=" + divID + " with template " + templateFile );

    var q = new libx.utils.collections.ActivityQueue();
    var delayTemplateProcessing = new libx.utils.collections.EmptyActivity();
    q.scheduleLast(delayTemplateProcessing);
    aQueues.push(delayTemplateProcessing);
    
    var processTemplateActivity = {
        onready: function (result, bundle) {
            var tmpdiv = $("#" + divID);
            var tmpparent = $(tmpdiv).parent();
            
            // set the global templateBundle variable to the bundle for this template
            templateBundle = bundle;
            
            // this is an array of "blockers"; each element in the array is the first
            // element of a different activity queue. here, each activity queue
            // being blocked represents a different template that needs to be processed
            var blockers = [];
            
            var jsPlate = new JsPlate ( result, templateFile, blockers, data );
            
            tmpdiv.replaceWith ( jsPlate.process(pref) );
            for (var i = 0; i < blockers.length; i++)
                blockers[i].markReady();
        }
    };
    
    q.scheduleLast(processTemplateActivity);
    
    libx.cache.defaultObjectCache.get( {
        dataType: "text",
        url: templateFile,
        error: function ( result, status, xhr ) {
            libx.log.write ( "Error callback for: " + divID + " w/ status: " + result );
        },
        success: function (result, status, xhr) {
        
            // get string bundles for this template
            var localeObj = {};
            result = result.replace(
                /\{BeginLocale=([a-zA-Z_]+)\}([\s\S]+?)\{EndLocale\}/gi,
                function(match, language, messages) {
                    localeObj[language] = libx.utils.json.parse(messages);
                    return "";
                }
            );
            
            // get default locale for this template
            var defaultLocale = null;
            result = result.replace(
                /{DefaultLocale=(.+)}/gi,
                function (match, locale) {
                    defaultLocale = locale;
                    // do not include this directive in template processing
                    return "";
                }
            );
            if (!defaultLocale) {
                // use en_US as default locale if not specified by template
                defaultLocale = "en_US";
            }
            
            var templateBundle = null;
            libx.locale.getBundle({
                object: localeObj,
                defaultLocale: defaultLocale,
                success: function (bundle) {
                    templateBundle = bundle;
                }
            });
            
            processTemplateActivity.markReady(result, templateBundle);
        }
    } );

    return "<div id='" + divID + "'/>";
}
