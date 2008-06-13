animateCue = function( cue )
{
    $(cue).show();
    $(cue).fadeOut("slow");
    $(cue).fadeIn("slow");
}

/*
 * Contact OCLC's xISBN service to  retrieve information about 'isbn', then
 * set cue's title attribute to result using catsearch.label format
 */
function createXISBNTooltip(cue, isbn, target) {
    libxEnv.xisbn.getISBNMetadataAsText(isbn, { 
        ifFound: function (text) {
            cue.title = "LibX: " + libxEnv.getProperty("catsearch.label", [target, text]);
        }
    });
}
