
libx.catalog.preview = {

    getPreviewer: function (catalog, jQuery) {
        for (var i in catalog.previewers) {
            if (catalog[i] != null)
                return new catalog.previewers[i](catalog, jQuery);
        }
        return null;
    },
    
    registerPreviewer: function (classDef) {
        var catalog = classDef.catalog;
        var previewkey = classDef.previewkey;
        libx.catalog.factory[catalog].prototype.previewers[previewkey] =
            libx.core.Class.create(libx.catalog.preview.Previewer, classDef);
    },
    
    Previewer: libx.core.Class.create({

        initialize: function (catalog) {
            this.catalog = catalog;
        },
        
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
        
        formatResult: function (result, $) {
            return result;
        }
        
    })
    
};
