/*
 */
// alert(jQuery);

(function ($) {

runDemo = function ( edition ) {
    $("#demo-iframe").show();
    var pf = $("#popup-iframe").get(0);
    if (edition != "") {
        pf.src = 'http://libx.org/libx2/libx2-git/src/base/popup/popup.html#editionrec=' + edition;
    } else {
        _gaq && _gaq.push(['_trackEvent', 'LibX Demo', 'EditionSearch', 'Show LibX 2.0 Popup' ]);
        pf.src = 'http://libx.org/libx2/libx2-git/src/base/popup/popup.html#showsearchbox';
    }
    /* Needed because of hash change. */
    pf.contentWindow.location.replace(pf.src);
    pf.contentWindow.location.reload();
}

$(function () {
    $(".libx-hide-parent").click(function () {
        $(this).parent().hide();
    });

    $("#demo-button").click(function () {
        runDemo("");
    });

$.getJSON('http://libx.org/libx2/libx2-git/src/autoedition/findbyip/?callback=?', function(data) {
    outputHTML = "<br /><br /><a href=\"http://libx.org/edition-recommendation-system/\">The following editions were recommended for you based on your IP address of " + data["ip"] + ":</a><br /><br /><ul>";
    data["editions"].sort(function(a, b) {
        return b["timestamp"] - a["timestamp"];
    });
    for (index = 0; index < data["editions"].length; index = index + 1) {
        var currentEdition = data["editions"][index];
        outputHTML = outputHTML + "<li><a href=\"#\" onclick=\"javascript:runDemo('" + currentEdition['id']  + "');\"><b><span class=\"editionDesc\">" + currentEdition["description"] + "</span></b>";
        outputHTML = outputHTML + " (id: <span class=\"editionId\">" + currentEdition["id"] + "</span>)";
        outputHTML = outputHTML + " maintained by <i><span class=\"editionMaintainers\">";
        outputHTML = outputHTML + currentEdition["maintainers"].join(", ");
        outputHTML = outputHTML + "</span></i>";
        var mod_date = new Date(currentEdition["timestamp"] * 1000);
        outputHTML = outputHTML + " modified on " + mod_date.toDateString();
        outputHTML = outputHTML + "</a></li>";
    }
    outputHTML = outputHTML + "</ul>";
    $('#libx-recommendations').html(outputHTML);
    $('#libx-recommendations .results div').click(function() {
        var editionId = $('span.editionId', this).html();
        var editionDesc = $('span.editionDesc', this).html();
        var editionMaintainers = $('span.editionMaintainers', this).html();
                //libx.on runDemo( edition ) {
                //        activity: "recommendation",
                //        edition: { id: editionId, desc: editionDesc }
                //});
                //popup.loadEdition({'id': editionId, 'shortDesc': editionDesc, 'maintainers': editionMaintainers});
    });
});


    $("#popup-iframe").load(function () {
        /* Work-around for FF bug.  If an iframe is initially hidden, $().show()
         * in popup.html does not work.
         * Apply work-around only for initial view.
         */
        var frame = $(this).get(0);
        if (frame.contentWindow.location.toString().match(/.*#showsearchbox/)) {
            frame.contentWindow.document.body.setAttribute("style", "display: block");
            frame.contentWindow.window.$("div#change-edition-view").get(0).style.display = "block";
        }

        var libx = $(this).get(0).contentWindow.libx;
        libx.events.addListener("EditionConfigurationLoaded", {
            onEditionConfigurationLoaded: function() {
                var $iButton = $("#libx-install-button");
                var downloadbase = "http://libx.org/releases/";
                if (window.chrome) {
                    var downloadurl = downloadbase + "gc/libx2-latest.crx?edition=" + libx.edition.id;
                    var label = "Install " + libx.edition.name.long + " for Chrome";
                } else
                if ($.browser.mozilla) {
                    var downloadurl = downloadbase + "ff/libx2-latest.xpi?edition=" + libx.edition.id;
                    var label = "Install " + libx.edition.name.long + " for Firefox";
                } else {
                    var label = "LibX is not supported for this browser";
                }
                $iButton.show().children("span").text(label).attr('title', downloadurl).click(function () {
                    window.location = downloadurl;
                });
               _gaq && _gaq.push(['_trackEvent', 'LibX Demo', 'EditionConfigurationLoaded', libx.edition.id + " " + libx.edition.name.long ]);
            }
        }, undefined, 'popup_reload_in_parent');
    });

});

})(jQuery);
