#!/bin/sh
#
# Concatenate and compress (via uglify) all code that needs to be included
# in LibX (client-side)
#
# The output of this script can be directed to > getlibx.js 
#

cat << EOF > /tmp/step2.js
libx.version = "2.0 (clientside)";

/* special client-side setup */
libx.cs = {
    proxy: function (sUrl) {
        return "../core/global/cs/proxy.php?url="+ encodeURIComponent(sUrl);
    },
    baseurl : "../../../"
};
EOF

FILES="
core/global/shared/core.js
core/global/shared/libx.js
/tmp/step2.js
core/global/shared/log.js
core/global/shared/utils/binary.js
core/global/cs/storage.js
core/global/shared/preferences.js
core/global/shared/cache/memorycache.js
core/global/shared/config.js
core/global/shared/config/xmlconfigwrapper.js
core/global/shared/config/editionconfigurationreader.js
core/global/shared/events.js
core/global/shared/utils/json.js
core/global/cs/detectbrowser.js
core/global/cs/log.js
core/global/cs/cache.js
core/global/cs/utils/timer.js
core/global/cs/utils/xml.js
core/global/cs/utils/browserprefs.js
core/global/shared/cache/objectcache.js
core/global/shared/locale.js
core/global/cs/locale.js
core/global/shared/libapp.js
core/global/shared/cache/validators.js
core/global/shared/utils.js
core/global/cs/utils.js
core/global/shared/cache/scheduler.js
core/global/shared/utils/hash.js
core/global/shared/catalog.js
core/global/shared/catalog/catalog.js
core/global/shared/catalog/preview.js
core/global/shared/catalog/factory/bookmarklet.js
core/global/shared/catalog/factory/scholar.js
core/global/shared/catalog/factory/millenium.js
core/global/shared/catalog/factory/horizon.js
core/global/shared/catalog/factory/voyager.js
core/global/shared/catalog/factory/aleph.js
core/global/shared/catalog/factory/sirsi.js
core/global/shared/catalog/factory/web2.js
core/global/shared/catalog/factory/centralsearch.js
core/global/shared/catalog/factory/custom.js
core/global/shared/catalog/factory/evergreen.js
core/global/shared/catalog/factory/worldcat.js
core/global/shared/catalog/factory/vubis.js
core/global/shared/catalog/factory/voyager7.js
core/global/shared/catalog/factory/talisprism.js
core/global/shared/catalog/factory/polaris.js
core/global/shared/catalog/factory/openurlresolver.js
core/global/shared/catalog/factory/primo.js
core/global/shared/openurl.js
core/global/shared/proxy.js
core/global/shared/proxy/factory/ezproxy.js
core/global/shared/proxy/factory/wam.js
core/global/shared/utils/stdnumsupport.js
core/global/cs/utils/xpath.js
core/global/shared/ui/jquery/autocomplete.js
core/global/shared/ui/jquery/dropdown.js
core/global/shared/ui/jquery/accordionmenu.js
core/global/shared/ui/magicsearch.js
core/global/shared/ui.js
core/global/shared/ui/contextmenu.js
core/global/cs/ui.js
core/global/shared/autoedition.js
core/global/cs/autoedition.js
core/global/shared/analytics.js
core/global/cs/analytics.js
core/global/shared/libapp/atomparser.js
getlibx-step3.js
"

if [ "x$1" = "x-v" ]; then
    cat `echo $FILES` > /tmp/before.js
    uglifyjs -nc -b < /tmp/before.js > /tmp/after.js
else
    cat `echo $FILES` | uglifyjs -nc
fi

