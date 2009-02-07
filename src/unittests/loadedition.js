
var editionConfigurationReader = new libx.config.EditionConfigurationReader( {
    url: "file:///home/www/libx.org/editions/vt.10/config.xml",
    onload: function (edition) {
        libx.edition = edition;
        logger.write ("loaded: " + edition.name['long'] + "\n");
    },
    onerror: function () {
        logger.write ( "Error: config file not found at " + this.url + "\n" );
        return;
    }
});

java.lang.Thread.sleep(500);

// test catalogs of this edition
for (var i = 0; i < libx.edition.catalogs.length; i++) {
    var c = libx.edition.catalogs[i];
    var options = String(c.options).split(/;/);
    var searchterm = "0123456789";  // happens to be valid ISBN
    for (var o = 0; o < options.length; o++) {
        var u = c.search([{ searchType: options[o], searchTerms: searchterm }]);
        libx.log.write("search " + c.name + " by " + options[o] + ": " + u);
    }
}

