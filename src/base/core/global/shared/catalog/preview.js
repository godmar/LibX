
/**
 * Namespace for catalog preview functionality.
 * If a previewer is supported, it will be shown in the LibX popup.
 *
 * @namespace
 */
libx.catalog.preview = {
    /**
     * Get the previewer for a catalog.
     * The previewer must have previously been registered using {@link
     * libx.catalog.preview.registerPreviewer}.
     *
     * @param {libx.catalog.Catalog} catalog  the catalog to find a previewer for
     * @param {Object} jQuery                 the jQuery object
     */
    getPreviewer: function (catalog, jQuery) {
        if (!catalog.actualpreviewers)
            return null;

        var previewer = null;
        for (var i in catalog.actualpreviewers) {
            var temp = new catalog.actualpreviewers[i](catalog, jQuery);
            if (catalog[i] != null && temp.isPreferred()) {
                previewer = temp;
                break;
            }
        }

        if (previewer)
            return previewer;
            
        for (var i in catalog.actualpreviewers) {
            if (catalog[i] != null) {
                return new catalog.actualpreviewers[i](catalog, jQuery);
            }
        }
        return null;
    }, 

    addActualPreviewer: function(catalog, previewkey, previewer) {
        
       if(!catalog.actualpreviewers) {
           catalog.actualpreviewers= {};
       }
       catalog.actualpreviewers[previewkey] = previewer;

    },  
    /**
     * Register a previewer.
     * @param {Object} classDef  the parameter object
     * @config {libx.catalog.Catalog} catalog  the catalog to register a previewer for
     * @config {String} previewkey  key used to identify this previewer.  this key must be
     *                              equal to the XML attribute for this catalog
     *                              that points to the preview URL.
     */
    registerPreviewer: function (classDef) {
        var catalog = classDef.catalog;
        var previewkey = classDef.previewkey;
        libx.catalog.factory[catalog].prototype.previewers[previewkey] =
            libx.core.Class.create(libx.catalog.preview.Previewer, classDef);
        var evt = new libx.events.Event('PreviewerRegistered');
        evt.notify();
    },
    
    Previewer: libx.core.Class.create(
        /** @lends libx.catalog.preview.Previewer.prototype */ {

        /**
         * Responsible for previewing results in the LibX popup.
         *
         * @constructs
         */
        initialize: function (catalog) {
            this.catalog = catalog;
        },
        
        /**
         * Preview a search.
         *
         * @param {Object} searchParams  search parameters
         * @param {Function(json)} callback  callback for results.  takes a
         *  single argument, which is the preview results in JSON.
         */
        doPreview: function (searchParams, callback) {
            var directSearchUrl = this.catalog.search(searchParams);
            var queryString = directSearchUrl.replace(/^.*\?/, "");
            var previewServer = this.catalog[this.previewkey];
            libx.cache.defaultMemoryCache.get({
                url: previewServer + "?" + queryString,
                dataType: "json",
                success: callback
            });
        },

         /*
         * Default method that returns true if any function has not been defined by the 
         * repective previewer
         * @return {bool} If the Previewer is valid/enabled
         */
        isPreferred: function() {
            return true;
        },
         /**
         * Format a result.
         * @param {Object} result  the result to format
         * @param {Object} $       the jQuery object
         * @returns {Object}       the formatted result
         */
        formatResult: function (result, $) {
            return result;
        },

        renderPreview: function(data, $elem, $) {
            $elem.html(data);
        }

        
    })
    
};
