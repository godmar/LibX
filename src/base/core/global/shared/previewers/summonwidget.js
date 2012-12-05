(function() {

libx.events.addListener("EditionConfigurationLoaded", {
    onEditionConfigurationLoaded: function () {
        for (var k = 0; k < libx.edition.catalogs.length; k++) {
            var catalog = libx.edition.catalogs[k];
            if ('url' in catalog && catalog.type == 'bookmarklet') {
                if (catalog.url.indexOf('summon.serialssolutions.com') > 0) {
                    libx.catalog.preview.addActualPreviewer(catalog, 'url', catalog.previewers['url']);
                    /* Add a preference the very first time a Summon edition is activated */
                    if (libx.prefs.browser.showsummonwidget == null) {
                        libx.prefs.browser._addPreference({ _name: "showsummonwidget", _type: "boolean" });
                        libx.prefs.browser.showsummonwidget._value = false;
                        libx.preferences.save();
                    }
                }
            }
        }
    }
}, undefined, 'init_summonWidget');

libx.catalog.preview.registerPreviewer({

    catalog: "bookmarklet",
    previewkey: "url",
    /*
    * Checks if the preference or other settings are enabled for the previewer
    * @return {bool} If the Previewer is valid/enabled
    */
    
    isPreferred : function () {
        return libx.prefs.browser.showsummonwidget._value;
    },

    /*
    * Gets Search params and queries the Summon Widget URL and executes the callback
    * @param {string array} List of Search pararms to construct query string
    * @param {callback} Callback to be executed after data is fetched
    */
    doPreview: function (searchparams, callback) {
        var inputstr = "";
        var values = searchparams;
        var i = 0;
        for(i=0; i < values.length;i++) {

            var value = values[i];
            if(value.searchTerms == "")
                continue;
            inputstr += " ";

            switch (value.searchType) {
                case "Y":
                    inputstr += value.searchTerms;
                break;
                case "a":
                    inputstr += "AuthorCombined:("+ value.searchTerms +")";
                break;
                case "t":
                    inputstr += "title:("+ value.searchTerms +")";
                break;
                case "jt":
                    inputstr += "PublicationTitle:"+ value.searchTerms;
                break;
                case "d":
                    inputstr += "SubjectTerms:"+ value.searchTerms;
                break;
                case "i":
                if (!libx.utils.stdnumsupport.isISBN(value.searchTerms) && libx.utils.stdnumsupport.isISSN(value.searchTerms)) {
                        inputstr += "issn:("+ value.searchTerms +")";
                    } else {
                        inputstr += "isbn:("+ value.searchTerms +")";
                }
                break;
            }
        }

         var prefix = this.getPrefix();
 
        var URL = "http://"+ prefix +".summon.serialssolutions.com/widgets/search?s.q=" + encodeURIComponent(inputstr) + "&s.ho=t&s.role=authenticated&format=searchwidget&callback=";
        libx.cache.defaultMemoryCache.get({
            url: URL,
            datatype: "json",
            success: callback,
        });
    },
    getPrefix: function() {
        var tempurl = this.catalog.url.split('.');
        var prefix = tempurl[0].substr(tempurl[0].indexOf('//') + 2, tempurl[0].length);
        return prefix;
    },

    renderPreview: function(data,$elem,$) {
        $elem.html(libx.utils.json.parse(data.substr(1, data.length-2)).results);
        libx.analytics && libx.analytics.track({
            activity: "search",
            catalog: this.catalog.name,
            searchtype: "Summon Widget"
        });

    }
});

 

}) ();
