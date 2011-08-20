
(function () {

/* Temporary types */
var docTypeIcons = {
    "Architectual Drawing": { },
    "Archival Material": { },
    "Atlas": { },
    "Audio Recording": { },
    "Audio Tape": { },
    "Book": { image: "Book.png" },
    "Book Chapter": { },
    "Book Review": { },
    "Compact Disc": { image: "CompactDisc.png" },
    "Computer File": { },
    "Course Reading": { },
    "Conference Proceeding": { image: "ConferenceProceedings.png" },
    "eBook": { },
    "eJournal": { },
    "Film": { },
    "Globe": { },
    "Government Document": { },
    "Image": { image: "Image.png" },
    "Journal": { image: "JournalArticle.png" },
    "Journal Article": { image: "JournalArticle.png" },
    "Kit": { },
    "Manuscript": { },
    "Map": { image: "Map.png" },
    "Microform": { },
    "Microfilm": { },
    "Music Score": { image: "MusicScore.png" },
    "Music Manuscript": { },
    "Music Recording": { },
    "Newspaper": { image: "Newspaper.png" },
    "Newspaper Article": { image: "Newspaper.png" },
    "Photograph": { },
    "Poster": { },
    "Realia":  { },
    "Sheet Music": { },
    "Special Collection": { },
    "Spoken Word Recording": { },
    "Dissertation": { image: "Thesis.png" },
    "Thesis": { image: "Thesis.png" },  /* ??? */
    "Video Recording": { image: "VideoRecording.png" },
    "Web Resource": { image: "Internet.png" },
    "DVD": { image: "DVD.png" }
};

libx.catalog.preview.registerPreviewer({

    catalog: "bookmarklet",
    previewkey: "summonproxyurl",
    
    /* Format a single line of a Summon result */
    formatResult: function (d, $) {
 
        function join(arr, max, replacewith) {
            if (arr == undefined)
                return;

            var f = "";
            $.each(arr, function (idx, el) {
                if (idx > max) {
                    f += replacewith;
                    replacewith = "";
                } else {
                    if (idx > 0) f += ", ";
                    f += el;
                }
            });
            return f;
        }

        var s = '<div style="clear: both">';
        var sep = "";
        function add(what) {
            if (what != undefined) {
                s += sep + what;
                sep = ", ";
            }
        }

        function addIf(prop, before, after) {
            if (!(prop in d))
                return;

            if (before != undefined)
                s += before;
            switch (typeof d[prop]) {
            case "boolean": 
                break;
            case "string":
                break;
            case "object":
                // the line below does not work as of FF6 due to bug
                // https://bugzilla.mozilla.org/show_bug.cgi?id=645130
                //if (d[prop] instanceof Array) {
                if (d[prop].length) {
                    s += d[prop][0];
                }
            }
            if (after != undefined)
                s += after;
        }

        /* Content Type */
        var ctype = d.ContentType[0];
        if (!(ctype in docTypeIcons && 'image' in docTypeIcons[ctype])) {
            var imgFile = "Generic.png";
        } else {
            var imgFile = docTypeIcons[ctype].image;
        }
        s += '<img title="' + ctype + '" style="float: left; padding: 2px" src="ctimages/' 
                + imgFile + '"></img>';

        function w(f) {
            if (f != undefined)
                return f[0];
        }
        /* strip HTML tags */
        function strip(s) {
            return s.replace(/<[^>]*>/g, "");
        }

        var title = w(d.Title);

        // what kind of hodgepodge is Summon sending?
        var uri = d.url || w(d.uri) || w(d.URI);
        if (uri)
            title = '<a title="' + uri + '" href="' + uri + '">' + title + '</a>';

        add(title);
        add(join(d.Author, 3, " et al"));

        /* do date - it's complicated, either PublicationDate, or PublicationDate_xml */
        if ('PublicationYear' in d) {
            addIf('PublicationYear');
        } else {
            if ('PublicationDate' in d)
                add(w(d.PublicationDate).replace(/^c/, "").substring(0, 4));
            /* else? */
        }

        /* weirdly enough, some information is sometimes expressed
         * as an array, and sometimes as a boolean, e.g.
         * IsScholarly : [ "true" ]
         * IsScholarly : true
         */
        function getBool(d, label) {
            if (!label in d)
                return; 
            switch (typeof d[label]) {
            case "boolean":
                return d[label];
            case "object":
                return d[label] == "true";
            }
        }

        switch (ctype) {
        case "Journal Article":
        case "Newspaper Article":
        case "Book Chapter":
            var ititle = "";
            if ('ISSN' in d) {
                ititle = "ISSN: " + w(d.ISSN);
            }
            if ('ISBN' in d)
                ititle = "ISBN: " + w(d.ISBN);

            var isScholarly = getBool(d, 'IsScholarly');
            if (isScholarly)
                ititle += " (Scholarly)";

            var isPeerReviewed = getBool(d, 'IsPeerReviewed');
            if (isPeerReviewed)
                ititle += " (PeerReviewed)";

            addIf('PublicationTitle', ' <i title="' + ititle + '">', '</i>.');
            addIf('NewspaperSection', ' ');
            addIf('Volume', ' ');
            addIf('Issue', '(', ')');
            addIf('Number', ':');
            addIf('StartPage', ', ');
            break;
        }

        add(' ');
        addIf('Abstract', '<span title="', '"> (Abstract)</span> ');    // i18n

        var $openUrlLink = "<span></span>";
        if ('openUrl' in d && libx.edition.openurl.primary) {
            var resolver = libx.edition.openurl.primary;
            var openurl = resolver.completeOpenURL(d.openUrl);
            if (false) {    // use openurl image
                var image = resolver.image || libx.edition.options.icon;
                $openUrlLink = $('<a href="' + openurl + '">' 
                    + '<img height="16px" title="Retrieve via ' + resolver.name + '"></img>'    // i18n
                    + '</a>');

                libx.utils.getEditionResource({
                    url: image,
                    success: function (data) {
                        $openUrlLink.find('img').attr('src', data);
                    }
                });
            } else {    // use openurl name
                $openUrlLink = $('&nbsp;<a href="' + openurl + '"' 
                    + ' title="Retrieve via ' + resolver.name + '">'  + resolver.name + '</a>');    // i18n
            }
        }
        s += "</div>";
        var $s = $(s);
        $s.append($openUrlLink);
        $s.append('<div style="clear: both; border-style: none none dotted none; border-bottom: 1px dotted #808080;"></div>');
        
        return $s;
    
    }

});

}) ();
