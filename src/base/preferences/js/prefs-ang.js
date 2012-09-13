/* New prefs */

function dots2uscore(s) {
    return s.replace(/\./g, "_");
}

function PrefsController($scope) {
    $scope.libx = libx;

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
    console.dir(libx.prefs);
    console.dir(libx.edition.options);

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
});

