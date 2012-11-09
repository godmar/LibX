/* New prefs */

function dots2uscore(s) {
    return s.replace(/\./g, "_");
}

function PrefsController($scope) {
    $scope.libx = libx;
    $scope.checktreenodetmpl= "checktreenode.tmpl"; 
    $scope.displaymode= false;
    $scope.preftmpl = "preference.tmpl"; 
  /* See https://groups.google.com/d/msg/angular/fGQnq7w83S0/gskWH4eurMYJ */
    $scope.$watch(function ($scope) {
        //console.log("persisting preferences.");
        //console.log("displaypref is: " + libx.prefs.browser.displaypref._value);
        libx.preferences.save();
    });

    $scope.locale = function (lkey) {
        var lkey = dots2uscore(lkey.replace(/^libx./, ""));
        return libx.locale.defaultStringBundle.getProperty(lkey);
    }
}

/* Initialize the tabs */
$(document).ready(function () {
    angular.bootstrap(document);

    $('#libx-prefs-tabs').tabs();

    // Set event handlers for textboxes
    $(".preference-text").live("change", function () {
        libx.preferences.getByID ( this.name )._setValue ( this.value );
        libx.preferences.save();
    } );

    // Set event handlers for checkboxes (outside ng model)
    $(".preference-checkbox").live("click", function () {
        libx.preferences.getByID ( this.name )._setValue ( this.checked );
        libx.preferences.save();
    } );
    
    // Set event handlers for radio buttons
    $(".preference-radio").live("click", function () {
        libx.preferences.getByID ( this.name )._setValue ( this.value );
        libx.preferences.save();
    } );

    var issummonprxyavail = false;
    var issummonurlavail = false;
    for (var k=0;k < libx.edition.catalogs.length; k++) {
        var catalog = libx.edition.catalogs[k];
        if ('url' in catalog && catalog.type == 'bookmarklet') {
            if(catalog.url.indexOf('summon.serialssolutions.com') > 0) {
                issummonurlavail = true;
            }
        }
        if ('summonproxyurl' in catalog) {
            issummonprxyavail = true;
        }
    }
    var issummonchkdisabled = !(issummonprxyavail && issummonurlavail);
    var chksummonwidgetname = libx.prefs.browser.showsummonwidget._id;
    setTimeout(function() {
        $('input[name='+chksummonwidgetname+']').attr('disabled', issummonchkdisabled);
    });
});

