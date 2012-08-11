<html>
<head>

<? 
 $base = "../../";
 $file = "getBase.php";
 if ( file_exists( $file ) )
 {
   include ('getBase.php');
 } 
?>

<script src="<? echo $base; ?>/src/base/core/global/shared/arrayfix.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/core.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/libx.js"></script>

<script type="text/javascript">
/* special client-side setup */
libx.cs = {
    proxy: function (sUrl) {
        return "<? echo $base; ?>/src/base/core/global/cs/proxy.php?url="+ encodeURIComponent(sUrl);
    },
    baseurl : "<? echo $base; ?>"
};
</script>

<script src="<? echo $base; ?>/src/base/core/global/shared/log.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/utils/binary.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/cs/storage.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/preferences.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/cache/memorycache.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/config.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/config/xmlconfigwrapper.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/config/editionconfigurationreader.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/events.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/utils/json.js"></script> 
<!-- 
    see http://truetalkdev.blogspot.com/2007/09/how-to-put-log-messages-in-firefox.html
-->
<script src="<? echo $base; ?>/src/base/core/global/cs/detectbrowser.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/cs/log.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/cs/cache.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/cs/utils/timer.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/cs/utils/xml.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/cs/utils/browserprefs.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/cache/objectcache.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/locale.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/cs/locale.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/libapp.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/cache/validators.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/utils.js"></script>
<!--redefining getBootstrapurl here for cs implementation -->
<script src="<? echo $base; ?>/src/base/core/global/cs/utils.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/cache/scheduler.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/utils/hash.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/utils/stdnumsupport.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/cs/utils/xpath.js"></script>
<!-- <script src="<? echo $base; ?>/src/base/core/global/shared/ui/jquery/autocomplete.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/ui/jquery/dropdown.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/ui/jquery/accordionmenu.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/ui/magicsearch.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/ui.js"></script>
<script src="<? echo $base; ?>/src/base/core/global/shared/ui/contextmenu.js"></script>
-->
<script src="<? echo $base; ?>/src/base/core/global/shared/libapp/atomparser.js"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>

<script>

try {
    libx.initialize(true);
} catch (err) {
    console.log("Error in libx.initialize(): " + err.message + "\nDesc: "+ err.description);
}

/* instead of calling libx.loadConfig (which would load a config.xml file,
 * say for vt edition), we fake a partial libx.edition. Just enough to make
 * libapp API work (libx.libapps.getPackages()) for first root package.
 * But this will not use EditionConfigurationReader and will not fire
 * EditionConfigurationLoaded
 */
libx.edition = {
    localizationfeeds: {
        package: [{
            description: "LibX 2.0 Core Package",
            type: "package",
            url: "<?    /*Package/Libapp/Module Url*/
                        $corepkg = isset($_GET['pkg']) ? 
                                $_GET['pkg'] :
                                "http://libx.org/libx2/libapps/libxcore";
                        echo $corepkg;
                  ?>"
        }]
    }
};

/* Now, we must make sure we don't proceed until we have the latest version
 * of all bootstrapped files (which includes the .tmpl our display relies on!)
 * in the cache.
 * Simulate the process that would be done in the actual plug-in.
 */
var jsonUrl = libx.utils.getBootstrapURL("updates.json");
/*libx.log.write("bootstrapurl is " + jsonUrl);*/
libx.cache.defaultHashScheduler = new libx.cache.HashScheduler(jsonUrl);
var pageProcessingQueue = new libx.utils.collections.DelayedActivityQueue();
libx.cache.defaultHashScheduler.updatesFinished = function () {
    // now we know that cache contains up-to-date versions of all templates
    pageProcessingQueue.markReady(); 
}
libx.cache.defaultHashScheduler.scheduleUpdates(true);

</script>

<!-- xxx: these elements copied from pref.xhtml; use that file directly if possible -->
<link type="text/css" href="<? echo $base; ?>/src/base/preferences/css/pepper-grinder/jquery-ui-1.8.4.custom.css" rel="stylesheet" />	
<link type="text/css" href="<? echo $base; ?>/src/base/preferences/prefs.css" rel="stylesheet" />	
<link type="text/css" href="<? echo $base; ?>/src/base/preferences/checktree/checktree.css" rel="stylesheet" />
<link rel="stylesheet" href="<? echo $base; ?>/src/base/preferences/jquery-tooltip/jquery.tooltip.css" />
<script src="<? echo $base; ?>/src/base/preferences/js/JsPlate.js" type="text/javascript" ></script>
<script src="<? echo $base; ?>/src/base/preferences/checktree/jquery.checktree.js" type="text/javascript"></script>
<script src="<? echo $base; ?>/src/base/preferences/jquery-tooltip/lib/jquery.bgiframe.js" type="text/javascript"></script>
<script src="<? echo $base; ?>/src/base/preferences/jquery-tooltip/lib/jquery.dimensions.js" type="text/javascript"></script>
<script src="<? echo $base; ?>/src/base/preferences/jquery-tooltip/jquery.tooltip.js" type="text/javascript"></script>
<script type="text/javascript" src="<? echo $base; ?>/src/base/preferences/js/jquery-ui-1.8.4.custom.min.js"></script>
<script type="text/javascript" src="<? echo $base; ?>/src/base/preferences/js/prefs.js"></script>

<script type="text/javascript">
$(document).ready ( function () {
    var processPage = {
        onready: function () {
            var result = process ( null, "libx.prefs.libapps", { libappdisplaymode: true });
            $('#content-div').append ( $( result.html ) );
            result.doPostInsertionProcessing();
        }
    };
    pageProcessingQueue.scheduleLast(processPage);
    processPage.markReady();
} );

</script>
</head>

<body id="body">
    <div id="content-div">
    </div>
</body>

</html>
