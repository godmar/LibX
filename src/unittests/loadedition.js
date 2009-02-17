
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

java.lang.Thread.sleep(1000);
