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
<link type="text/css" href="loading.css" rel="stylesheet" />
<script src="<? echo $base; ?>/src/base/getlibx.js"></script>
<script type="text/javascript">
/* special client-side setup */

libx.cs.baseurl = "<? echo $base; ?>";

</script>
 
<!-- 
    see http://truetalkdev.blogspot.com/2007/09/how-to-put-log-messages-in-firefox.html
-->

<script src="<? echo $base; ?>/src/base/bootstrapped/scripts/jquery-latest.js"></script>

<script>
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
</script>
<script type="text/javascript">
try {
    libx.initialize(true);
} catch(err) {
    libx.log.write("Error in libx.initialize(): " + err.message + "\nDesc: " + err.description);
}
</script>

<!-- xxx: these elements copied from pref.xhtml; use that file directly if possible -->
<link type="text/css" href="<? echo $base; ?>/src/base/preferences/css/pepper-grinder/jquery-ui-1.8.23.custom.css" rel="stylesheet" />	
<link type="text/css" href="<? echo $base; ?>/src/base/preferences/prefs.css" rel="stylesheet" />	
<link type="text/css" href="<? echo $base; ?>/src/base/preferences/checktree/checktree.css" rel="stylesheet" />
<link rel="stylesheet" href="<? echo $base; ?>/src/base/preferences/jquery-tooltip/jquery.tooltip.css" />
<script src="<? echo $base; ?>/src/base/preferences/checktree/jquery.checktree.js" type="text/javascript"></script>
<script src="<? echo $base; ?>/src/base/preferences/jquery-tooltip/lib/jquery.bgiframe.js" type="text/javascript"></script>
<script src="<? echo $base; ?>/src/base/preferences/jquery-tooltip/jquery.tooltip.js" type="text/javascript"></script>
<script type="text/javascript" src="<? echo $base; ?>/src/base/preferences/js/jquery-ui-1.8.23.custom.min.js"></script>
<script src="<? echo $base; ?>/src/base/preferences/js/angular-1.0.1.js" type="text/javascript"></script>
<script src="<? echo $base; ?>/src/base/preferences/js/libapptree.js" type="text/javascript"></script>

<script type="text/javascript">
function dots2uscore(s) {
    return s.replace(/\./g, "_");
}

function PrefsController($scope) {
    $scope.libx = libx;
    $scope.basepath = "<? echo $base; ?>";
    $scope.prefpath = $scope.basepath + "/src/base/preferences/";
    $scope.checktreenodetmpl= $scope.prefpath + "checktreenode.tmpl";
    $scope.preftmpl = $scope.prefpath + "preference.tmpl";
    $scope.displaymode = true;
    $(".bar").show();
    $scope.hideloading = function(){
    $(".spinner").hide();
}
    $scope.locale = function (lkey) {
          var lkey = dots2uscore(lkey.replace(/^libx./, ""));
          return libx.locale.defaultStringBundle.getProperty(lkey);
    }
}

$(document).ready ( function () {
    angular.bootstrap(document);
} );

</script>
</head>

<body id="body" ng-controller="PrefsController">
    <div id="libapps-tmpl" class="ui-tabs ui-widget ui-widget-content ui-corner-all" style="background: transparent; background-position: initial initial; background-repeat: initial initial" ng-controller="TreeController">
       <div id="libapps-banner" class="libapps-banner" style="display:block;">
       <p>
           <span class="libapps-banner-header">Libapps Display Tree:</span>
       <p> 
       <ul>
           <li>- <span class="libapps-banner-sub-header">To explore packages/libapps, expand the tree</span>
           </li>
           <li>- <span class="libapps-banner-sub-header">To see details click on any label </span>
           </li>
       </ul>
       </div>	
  
      <div class="spinner">
            <div class="bar1"></div>
            <div class="bar2"></div>
            <div class="bar3"></div>
            <div class="bar4"></div>
            <div class="bar5"></div>
            <div class="bar6"></div>
            <div class="bar7"></div>
            <div class="bar8"></div>
            <div class="bar9"></div>
            <div class="bar10"></div>
            <div class="bar11"></div>
            <div class="bar12"></div>
            <span class="loadtxt">Loading....</span>
       </div>
       <ul class="checktree"> 
	    <ng-include src="checktreenodetmpl" onload="hideloading()" ng-repeat="entry in model.children" />
       </ul>
    </div>
</body>

</html>
