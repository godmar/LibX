/*
 * Convenience functions to support LibX 1.5 "legacy" cues.
 *
 * These functions will execute in a 
 *
 * 'window' and 'document' refer to the current content window's 
 * window and document.
 */

/**
 * Utility functions and classes to support old-style cues.
 *
 * @namespace libx.cues
 */
libx.cues = { }

libx.cues.Cue = libx.core.Class.create(
    /** @lends libx.cues.Cue.prototype */ {
	/**
	 * Helper class that creates a cue logo to be inserted
	 * The equivalent html is:
	 * <a title="[title]" href="[url]"><img src="[imageurl]" border="0"/></a>
	 *
	 * If imageurl is not given, //options/cueicon is used.
	 * If //options/cueicon is not given, /options/icon is used.
     *
     * @param {String} url href attribute for link
     * @param {String} title title attribute for link
     * @param {String} imageurl url of image to use (optional)
     * @param {Object} either a catalog or openurl resolver
     * @constructs
	 */
    initialize : function (url, title, imageurl) {
        var doc = document;
        var link = doc.createElement('a');
        link.setAttribute('title', title);
        link.setAttribute('href', url);
        var image = doc.createElement('img');
        if (imageurl) {
            image.setAttribute('src', imageurl);
        } else {
            if (libx.edition.options.cueicon != null)
                image.setAttribute('src', libx.edition.options.cueicon);
            else
                image.setAttribute('src', libx.edition.options.icon);
        }
        image.setAttribute('border', '0');
        link.appendChild(image);
        this.cue = link;
    },
    
    /**
     * Insert cue
     */
    insertBefore : function (domSibling) {
        domSibling.parentNode.insertBefore(this.cue, domSibling.nextSibling);
    },

    /**
     * Animate this cue
     */
    animate : function () {
        var thisCue = $(this.cue);
        thisCue.show();
        thisCue.fadeOut("slow");
        thisCue.fadeIn("slow");
    }
});

/**
 * @name libx.cues.CatalogCue
 *
 * Subclass of cue that uses properties of a configured libx catalog
 */
libx.cues.CatalogCue = libx.core.Class.create(libx.cues.Cue,
    /** @lends libx.cues.CatalogCue.prototype */ {
    /**
     * Create a cue that searches a catalog.
     *
     * @param {String} searchtype
     * @param {String} searchterms
     * @param {libx.catalogs.Catalog} catalog (optional)
     */
    initialize : function (searchtype, searchterms, catalog) {
        catalog = catalog || libx.edition.catalogs.primary;
        var searchUrl = catalog.makeSearch(searchtype, searchterms);
        var searchImage = catalog.image || null;

        // create localized label based on current locale and search type
        var searchTitle = "Search " + catalog.name;
        var localizedLabel = null;
        switch (searchtype) {
        case 'Y':
            localizedLabel = "catalog.contextmenu.search.label"; break;
        case 'i':
            localizedLabel = "isbnsearch.label"; break;
        case 'is':
            localizedLabel = "issnsearch.label"; break;
        case 'xisbn':
            localizedLabel = "xisbnsearch.label"; break;
        case 'c':
            localizedLabel = "callnolookup.label"; break;
        }
        if (localizedLabel)
            searchTitle = libx.locale.getProperty(localizedLabel, catalog.name, searchterms);

        this.parent(searchUrl, searchTitle, searchImage);
    }
});

/*
 * Contact OCLC's xISBN service to  retrieve information about 'isbn', then
 * set cue's title attribute to result using catsearch.label format
 */
/* TO BE DONE
function createXISBNTooltip(cue, isbn, target) {
    libxEnv.xisbn.getISBNMetadataAsText(isbn, { 
        ifFound: function (text) {
            cue.title = "LibX: " + libxEnv.getProperty("catsearch.label", [target, text]);
        }
    });
}
*/
