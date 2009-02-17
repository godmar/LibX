load("loadedition.js")

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

