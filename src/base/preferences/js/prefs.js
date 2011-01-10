
var templateBundle = null;
var prefBundle = {
    bundle : null,
    getProperty : function (prefix, name, defaultValue) {
        
        // remove the prefix for this preference name
        // e.g., libx.prefs.http://feedurl.com/24.mypref becomes mypref
        if (prefix)
            name = name.replace(prefix + ".", "");
        
        // the locale string for "enabled" is not specific to the libapp/module
        if (name == "enabled")
            return templateBundle.getProperty(name);
            
        var val = "[" + name + "]";
        if (this.bundle)
            val = this.bundle.getProperty(name);
        // if (val == "[" + name + "]") {
            // var GetModuleLocaleClass = new libx.core.Class.create(libx.libapp.PackageVisitor, {
                // onmodule: function (module) {
                    // //BRN: this is async!
                    // //possible solution: load all libapps/modules in advance
                // }
            // });
            // var getModuleLocaleVisitor = new GetModuleLocaleClass();
            // new libx.libapp.PackageWalker(/*FEED URL GOES HERE*/).walk(getModuleLocaleVisitor);
        // }
            
        if ( defaultValue !== undefined && val == "[" + name + "]" )
            val = defaultValue;
        return val;
    }
};

var templateID = 0;
//BRN: change this
var base = "http://libx2.cs.vt.edu/libx.org/libxrestructuring/src/base/bootstrapped/preferences/templates/";
var ext = ".tmpl";

$(document).ready ( function () {

    var aQueues = [];
    
    // Process the first template, which will create tabs and recursively process
    // each subsequent template
    var result = process ( aQueues, "", libx.prefs, "libx.prefs" );

    // Clone and append to main document
    // This evaluates scripts and style sheets ( setting the innerHTML does not seem to )
    
    $('#content-div').append ( $( result ) );
    
    aQueues[0].markReady();
    
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
*/
function process ( aQueues, prefix, pref, layout ) {
    
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
    
    libx.log.write ( "Processing div id=" + divID + " with template " + templateFile );

    var q = new libx.utils.collections.ActivityQueue();
    var delayTemplateProcessing = new libx.utils.collections.EmptyActivity();
    q.scheduleLast(delayTemplateProcessing);
    aQueues.push(delayTemplateProcessing);
    
    var defaultLocale = null;
    
    var processTemplateActivity = {
        onready: function (result) {
            var tmpdiv = $("#" + divID);
            var tmpparent = $(tmpdiv).parent();
            
            var blockers = [];
            
            // get the prefix for this preference
            // e.g., the prefix for libx.prefs.browser.displaypref is libx.prefs.browser
            // this prefix is removed for locale keys
            if (pref && (/:\/\//.test(pref._name) || /^libx\.prefs\.[^\.]+$/.test(pref._idstr)))
                prefix = pref._idstr;
            var jsPlate = new JsPlate ( result, templateFile, blockers, prefix );
            tmpdiv.replaceWith ( jsPlate.process(pref) );
            
            for (var i = 0; i < blockers.length; i++)
                blockers[i].markReady();
            
            initTemplate(tmpparent);
        }
    };
    
    var setTemplateLocaleActivity = {
        onready: function (bundle) {
            templateBundle = bundle;
        }
    };
    
    var getTemplateLocaleActivity = {
        onready: function (result) {
            result = result.replace(
                /{DefaultLocale=(.+)}/gi,
                function (match, locale) {
                    defaultLocale = locale;
                    // do not include this directive in template processing
                    return "";
                }
            );
            if (!defaultLocale) {
                libx.log.write("No DefaultLocale specified for " + templateFile + "; defaulting to en_US");
                defaultLocale = "en_US";
            }
            
            processTemplateActivity.markReady(result);
            
            libx.locale.getBundle( {
                defaultLocale: defaultLocale,
                url: templateFile.replace(/([^:]+:\/\/.*\/)(.*)\.tmpl/, '$1locales\/$locale$\/$2.json'),
                error: function ( result ) {
                    setTemplateLocaleActivity.markReady();
                    libx.log.write ( "Error callback for: " + divID + " w/ status: " + result );
                },
                success: function ( stringBundle ) {
                    setTemplateLocaleActivity.markReady(stringBundle);
                }
            } );
            
        }
    };
    
    var setPrefLocaleActivity = {
        // If bundle is null, keep previously processed pref so that children of
        // module/libapp entries still use the correct locale bundle
        onready: function (bundle) {
            if (bundle)
                prefBundle.bundle = bundle;
        }
    };
    
    q.scheduleLast(getTemplateLocaleActivity);
    q.scheduleLast(setTemplateLocaleActivity);
    q.scheduleLast(setPrefLocaleActivity);
    q.scheduleLast(processTemplateActivity);

    // preference is libapp or module
    if (pref && /:\/\//.test(pref._name)) {
        libx.locale.getBundle( {
            feed: pref._name,
            error: function ( result ) {
                setPrefLocaleActivity.markReady();
            },
            success: function ( stringBundle ) {
                setPrefLocaleActivity.markReady(stringBundle);
            }
        } );
    } else if (pref && /^libx\.prefs\.[^\.]+$/.test(pref._idstr)) {
        //BRN: add bundle fetching for browser.prefs.xml, etc.
        libx.locale.getBundle( {
            //BRN: factor this out
            defaultLocale: "en_US",
            url: "http://libx2.cs.vt.edu/libx.org/libxrestructuring/src/base/bootstrapped/preferences/builtin/locales/$locale$/" + pref._name + ".json",
            error: function ( result ) {
                setPrefLocaleActivity.markReady();
            },
            success: function ( stringBundle ) {
                setPrefLocaleActivity.markReady(stringBundle);
            }
        } );
    } else {
        setPrefLocaleActivity.markReady();
    }
    
    libx.cache.defaultObjectCache.get( {
        dataType: "text",
        url: templateFile,
        error: function ( result, status, xhr ) {
            libx.log.write ( "Error callback for: " + divID + " w/ status: " + result );
        },
        success: function (result, status, xhr) {
             getTemplateLocaleActivity.markReady(result);
        }
    } );

    return "<div id='" + divID + "'/>";
}

/**
 * Various initialization functions are executed after templates are loaded
 */
function initTemplate ( elem ) {

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

    // Set event handlers for radio buttons
    $(":radio", elem).click( function () {
        libx.preferences.getByID ( this.name )._setValue ( this.value );
        libx.preferences.save();
    } );
    
    // Initialize the trees
    $("ul.tree").checkTree();
    // // Initialize the trees
    // $("ul.tree", elem).checkTree({
        // labelAction: "expand",
        
        // /**
         // *    onCheck handler called when a checkbox is checked
         // *    @param obj - the li parent for the item that was checked
         // *    Updates the global preferences
         // */
        // onCheck : function ( obj ) {
            // obj.children(":checkbox.preference-checkbox").each (
                // function ( i, elem ) {
                    // libx.preferences.getByID ( elem.name )._setValue ( true );
                // } );
        // },
        
        // /**
         // *    onUnCheck handler called when a checkbox is checked
         // *    @param obj - the li parent for the item that was checked
         // *    Updates the global preferences
         // */
        // onUnCheck : function ( obj ) {
            // obj.children(":checkbox.preference-checkbox").each (
                // function ( i, elem ) {
                    // libx.preferences.getByID ( elem.name )._setValue ( false );
                // } );
        // }
    // });
    // // Fix the checked state of parents of checkboxes
    // $("ul.tree :checkbox[checked]", elem).siblings(".checked").click().click();
    // // Open up to show all items that are currently checked
    // $("ul.tree .checked,.half_checked", elem).siblings( ".arrow.collapsed").click();
                
}
