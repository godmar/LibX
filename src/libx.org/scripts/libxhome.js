/*
 */
// alert(jQuery);

(function ($) {

$(function () {
    $(".libx-hide-parent").click(function () {
        $(this).parent().hide();
    });

    $("#demo-button").click(function () {
        _gaq && _gaq.push(['_trackEvent', 'LibX Demo', 'EditionSearch', 'Show LibX 2.0 Popup' ]);
        $("#demo-iframe").show();
        var pf = $("#popup-iframe").get(0);
        pf.contentWindow.location.replace(pf.src);
    });

    $("#popup-iframe").load(function () {
        /* Work-around for FF bug.  If an iframe is initially hidden, $().show()
         * in popup.html does not work
         */
        var frame = $(this).get(0);
        frame.contentWindow.document.body.setAttribute("style", "display: block");
        frame.contentWindow.window.$("div#change-edition-view").get(0).style.display = "block";

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
