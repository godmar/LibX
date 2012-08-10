libx.utils.coins = {};

(function () {
var coinsfields = ['atitle',
                     'title',
                     'jtitle',
                     'stitle',
                     'date',
                     'volume',
                     'issue',
                     'spage',
                     'epage',
                     'pages',
                     'artnum',
                     'issn',
                     'eissn',
                     'aulast',
                     'aufirst',
                     'auinit',
                     'auinit1',
                     'auinitm',
                     'ausuffix',
                     'au',
                     'aucorp',
                     'isbn',
                     'coden',
                     'sici',
                     'genre',
                     'chron',
                     'ssn',
                     'quarter',
                     'part',
                     'btitle',
                     'place',
                     'pub',
                     'edition',
                     'tpages',
                     'series',
                     'bici'];

/* TBD: precompile regexp once and store in private var */

/**
 * XXX
 */
libx.utils.coins.parse = function(context) {
    var scraped_fields = {};
    for (field in coinsfields) {
        cfield = coinsfields[field];
        var pattern = new RegExp("rft\." + cfield + "=([^&]*)","g");
        var offsetBy = "rft.=".length;
        matches = context.match(pattern);
        if (matches) {
            scraped_fields["_" + cfield] = [];
            for (match in matches) {
                scraped_fields["_" + cfield].push(matches[match].substring(cfield.length + offsetBy));
            }
            scraped_fields[cfield] = scraped_fields["_" + cfield][0];
        } else {
            /* let's not do this - keep absent fields undefined */
            scraped_fields[cfield] = "";
            scraped_fields["_" + cfield] = [];
        }
    }
    return scraped_fields;
}
})();
