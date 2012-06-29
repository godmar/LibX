/*
 * Convenience functions to support LibX 1.5 "legacy" cues.
 *
 * These functions will execute in a 
 *
 * 'window' and 'document' refer to the current content window's 
 * window and document.
 *
 * FIXME: currently, this script assumes $ is defined in some places, 
 * so any module requiring legacy-cues must first require $.
 * Possible fix: just always include jquery, period.
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
     * @constructs
	 */
    initialize : function (url, title, imageurl) {
        var doc = document;
        var link = doc.createElement('a');
        if( title )
           link.setAttribute('title', title);
        link.setAttribute('href', url);
        var image = doc.createElement('img');
        if (!imageurl) {
            if (libx.edition.options.cueicon != null)
                imageurl = libx.edition.options.cueicon;
            else
                imageurl = libx.edition.options.icon;
        }
        var chromestr = "chrome://";
        if (imageurl.substr(0, chromestr.length) == chromestr) {
            libx.utils.getEditionResource({
                url: imageurl,
                success: function (dataURI) {
                    image.setAttribute('src', dataURI);
                }
            });
        } else
            image.setAttribute('src', imageurl);
        image.setAttribute('border', '0');
        image.setAttribute('height', '16px');
        link.appendChild(image);
        this.image = image;
        this.cue = link;
    },
    
    /**
     * Insert cue
     */
    insertBefore : function (domSibling) {
        domSibling.parentNode.insertBefore(this.cue, domSibling.nextSibling);
    },

    /**
     * Set attributes of image
     */
    setImageAttribute : function (attr, value) {
        this.image.setAttribute(attr, value);
    },

    /**
     * Set attributes of image
     */
    getImageAttribute : function (attr) {
        return this.image.getAttribute(attr);
    },

    /**
     * Set attributes of link
     */
    setAttribute : function (attr, value) {
        this.cue.setAttribute(attr, value);
    },

    /**
     * Animate this cue
     */
    animate : function () {
        var thisCue = $(this.cue);
        thisCue.show();
        thisCue.fadeOut("slow");
        thisCue.fadeIn("slow");
    },
    /**
     * Attach click event handler for this cue
     */
    onClick : function( handler ) {
        $(this.cue).click(handler);
    }
});

libx.cues.StandardCoins = libx.core.Class.create(libx.cues.Cue,
    /** @lends libx.cues.StandardCoins.prototype */ {
    /**
     * Create a cue that processes a COinS
     *
     * @param {String} contextobj
     * @param {OpenURLResolver} resolver (optional) - if omitted, the primary resolver is used
     * @constructs
     */
    initialize : function (contextobj, resolver) {
        resolver = resolver || libx.edition.openurl.primary;
        var searchUrl = resolver.completeOpenURL(contextobj);
        var searchTitle = libx.locale.defaultStringBundle.getProperty("label_search_catalog", resolver.name);
        
        if (resolver.image) {
            this.parent(searchUrl, searchTitle);
            var self = this;
            libx.utils.getEditionResource({
                url: resolver.image,
                success: function (dataURI) {
                    self.setImageAttribute('src', dataURI);
                }
             });
        } else {
            this.parent(searchUrl, searchTitle, libx.edition.options.icon);
            this.setImageAttribute('src', libx.edition.options.icon);
        }
       
    }
});

libx.cues.CatalogCue = libx.core.Class.create(libx.cues.Cue,
    /** @lends libx.cues.CatalogCue.prototype */ {
    /**
     * Create a cue that searches a configured catalog
     *
     * @param {String} searchtype
     * @param {String} searchterms
     * @param {libx.catalogs.Catalog} catalog (optional) - if omitted, the primary catalog is used
     * @constructs
     */
    initialize : function (searchtype, searchterms, catalog) {
        catalog = catalog || libx.edition.catalogs.primary;
        var searchUrl = catalog.makeSearch(searchtype, searchterms);
        var searchImage = catalog.image || null;

        // create localized label based on current locale and search type
        searchTitle = libx.locale.defaultStringBundle.getProperty('label_search_catalog_type_str',
                        catalog.name, libx.edition.searchoptions[searchtype], searchterms);

        // create cue
        this.parent(searchUrl, searchTitle, searchImage);

        // add useful tooltip
        switch (searchtype) {
        case 'i':
            var isbn = libx.utils.stdnumsupport.isISBN(searchterms, catalog.downconvertisbn13);
            libx.cues.addISBNMetadataTooltip(this.cue, catalog.name, isbn);
            break;
        case 'is':
            break;
        }
    }
});

libx.cues.Autolink = libx.core.Class.create(
    /** @lends libx.cues.Autolink.prototype */ {
	/**
	 * Helper class that creates an autolink based on the user's preferences.
	 * The equivalent html is:
	 * &lt;a title="[title]" href="[url]"&gt;some element&lt;/a&gt;
     *
     * @param {String} url href attribute for link
     * @param {String} title title attribute for link
     * @constructs
	 */
    initialize : function (domelement, url, title) {
        var doc = document;
        var link = doc.createElement('a');
        if( title )
           link.setAttribute('title', title);
        link.setAttribute('href', url);
        link.style.borderBottom = 
            libx.utils.browserprefs.getStringPref("libx.autolinkstyle", 
                                   libx.edition.options.autolinkstyle);

        link.className = "libx-autolink";

        var oldParent = domelement.parentNode;
        var oldSibling = domelement.nextSibling;
        link.appendChild(domelement);
        oldParent.insertBefore(link, oldSibling);

        this.link = link;
    },
    /**
     * Attach click event handler for this cue
     */
    onClick : function( handler ) {
        $(this.link).click(handler);
    }
    
});

/**
 * Contact PubMed service to retrieve information about 'pmid', then
 * create tooltip using catalog.contextmenu.search.label localized
 * template
 *
 * @param {DOMElement} domelement - element to which to add the tooltip
 * @param {String} catalogname - name of catalog
 * @param {String} pmid - pmid to use in PubMed service
 */
libx.cues.addPubmedMetadataTooltip = function (domelement, catalogname, pmid) {
    libx.services.pubmed.getPubmedMetadata({
        pubmedid: pmid,
        ifFound: function (text) {
            domelement.setAttribute('title', 
                libx.locale.defaultStringBundle.getProperty("label_search_catalog_str", catalogname, text));
        }
    });
};

/**
 * Contact OCLC's xISBN service to  retrieve information about 'isbn', then
 * create tooltip using catalog.contextmenu.search.label localized
 * template
 *
 * @deprecated
 *
 * @param {DOMElement} domelement - element to which to add the tooltip
 * @param {String} catalogname - name of catalog
 * @param {String} isbn - isbn to use in xISBN service
 */
libx.cues.addISBNMetadataTooltip = function (domelement, catalogname, isbn) {
    libx.services.xisbn.getISBNMetadata({
        isbn: isbn,
        ifFound: function (text) {
            domelement.setAttribute('title', 
                libx.locale.defaultStringBundle.getProperty("label_search_catalog_str", catalogname, text));
        }
    });
};

/**
 * Contact OCLC's xISBN service to  retrieve information about 'issn', then
 * create tooltip using catalog.contextmenu.search.label localized
 * template. 
 *
 * @param {DOMElement} domelement - element to which to add the tooltip
 * @param {String} catalogname - name of catalog
 * @param {String} issn - issn to use in xISBN service
 */
libx.cues.addISSNMetadataTooltip = function (domelement, catalogname, issn) {
    libx.services.xisbn.getISSNMetadataAsText({
        issn: issn,
        ifFound: function (text) {
            domelement.setAttribute(
				'title', 
				"LibX: " + libx.locale.defaultStringBundle.getProperty("label_search_catalog_str", catalogname, text));
        },
		notFound: function () {
			domelement.setAttribute('title', "No information available");
		}
    });
};

/**
 * Contact CrossRef's DOI service to retrieve information about 'doi', then
 * create tooltip using catalog.contextmenu.search.label localized
 * template. 
 *
 * @param {DOMElement} domelement - element to which to add the tooltip
 * @param {String} catalogname - name of catalog
 * @param {String} doi - doi to use in DOI service
 */
libx.cues.addDOIMetadataTooltip = function (domelement, catalogname, doi) {
    libx.services.crossref.getDOIMetadata({
        doi: doi,
        ifFound: function (text) {
            domelement.setAttribute(
				'title', 
				"LibX: " + libx.locale.defaultStringBundle.getProperty("label_search_catalog_str", catalogname, text));
        },
		notFound: function () {
			domelement.setAttribute('title', "No information available");
		}
    });
};
