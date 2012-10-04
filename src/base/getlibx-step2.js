/* 
 * Bootstrap LibX code for inclusion in popup.html's getlibx.js, when
 * run in clientside mode.
 */

(function() {

function loadFiles(prefix, libxFiles) {
    for (var i = 0; i < libxFiles.length; i++) {
        document.write('<script src="' + prefix + libxFiles[i] + '"></script>\n');
    }
}

libx.version = "2.0 (clientside)";

/* special client-side setup */
libx.cs = {
    proxy: function (sUrl) {
        return "../core/global/cs/proxy.php?url="+ encodeURIComponent(sUrl);
    },
    baseurl : "../../../"
};

var libxFiles1 = [
    "src/base/core/global/shared/log.js",
    "src/base/core/global/shared/utils/binary.js",
    "src/base/core/global/cs/storage.js",
    "src/base/core/global/shared/preferences.js",
    "src/base/core/global/shared/cache/memorycache.js",
    "src/base/core/global/shared/config.js",
    "src/base/core/global/shared/config/xmlconfigwrapper.js",
    "src/base/core/global/shared/config/editionconfigurationreader.js",
    "src/base/core/global/shared/events.js",
    "src/base/core/global/shared/utils/json.js" ,
    "src/base/core/global/cs/detectbrowser.js",
    "src/base/core/global/cs/log.js",
    "src/base/core/global/cs/cache.js",
    "src/base/core/global/cs/utils/timer.js",
    "src/base/core/global/cs/utils/xml.js",
    "src/base/core/global/cs/utils/browserprefs.js",
    "src/base/core/global/shared/cache/objectcache.js",
    "src/base/core/global/shared/locale.js",
    "src/base/core/global/cs/locale.js",
    "src/base/core/global/shared/libapp.js",
    "src/base/core/global/shared/cache/validators.js",
    "src/base/core/global/shared/utils.js",
    "src/base/core/global/cs/utils.js",
    "src/base/core/global/shared/cache/scheduler.js",
    "src/base/core/global/shared/utils/hash.js",
    "src/base/core/global/shared/catalog.js",
    "src/base/core/global/shared/catalog/catalog.js",
    "src/base/core/global/shared/catalog/preview.js",
    "src/base/core/global/shared/catalog/factory/bookmarklet.js",
    "src/base/core/global/shared/catalog/factory/scholar.js",
    "src/base/core/global/shared/catalog/factory/millenium.js",
    "src/base/core/global/shared/catalog/factory/horizon.js",
    "src/base/core/global/shared/catalog/factory/voyager.js",
    "src/base/core/global/shared/catalog/factory/aleph.js",
    "src/base/core/global/shared/catalog/factory/sirsi.js",
    "src/base/core/global/shared/catalog/factory/web2.js",
    "src/base/core/global/shared/catalog/factory/centralsearch.js",
    "src/base/core/global/shared/catalog/factory/custom.js",
    "src/base/core/global/shared/catalog/factory/evergreen.js",
    "src/base/core/global/shared/catalog/factory/worldcat.js",
    "src/base/core/global/shared/catalog/factory/vubis.js",
    "src/base/core/global/shared/catalog/factory/voyager7.js",
    "src/base/core/global/shared/catalog/factory/talisprism.js",
    "src/base/core/global/shared/catalog/factory/polaris.js",
    "src/base/core/global/shared/catalog/factory/openurlresolver.js",
    "src/base/core/global/shared/catalog/factory/primo.js",
    "src/base/core/global/shared/openurl.js",
    "src/base/core/global/shared/proxy.js",
    "src/base/core/global/shared/proxy/factory/ezproxy.js",
    "src/base/core/global/shared/proxy/factory/wam.js",
    "src/base/core/global/shared/utils/stdnumsupport.js",
    "src/base/core/global/cs/utils/xpath.js",
    "src/base/core/global/shared/ui/jquery/autocomplete.js",
    "src/base/core/global/shared/ui/jquery/dropdown.js",
    "src/base/core/global/shared/ui/jquery/accordionmenu.js",
    "src/base/core/global/shared/ui/magicsearch.js",
    "src/base/core/global/shared/ui.js",
    "src/base/core/global/shared/ui/contextmenu.js",
    "src/base/core/global/cs/ui.js",
    "src/base/bootstrapped/global/shared/libapp/atomparser.js",
    "src/base/getlibx-step3.js"
];

loadFiles(libx.cs.baseurl, libxFiles1);

document.write('<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>');

})();
