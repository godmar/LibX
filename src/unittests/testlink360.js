load("loadlibx.js");
load("loadedition.js");

load("../libx2/base/link360service.js");

var link360 = libx.services.link360.getLink360(libx.edition);
var queries = [ 
    { query: "id=doi:10.1074/jbc.M004545200", type: "journal" },
    { query: "url_ver=Z39.88-2004&rft_id=info:doi/10.1074/jbc.M004545200", type: "article" },
    { query: "ctx_ver=Z39.88-2004&rft_val_fmt=info:ofi/fmt:kev:mtx:journal&rft_id=info:pmid/16646082&rft.genre=article", type: "article" },
    { query: "url_ver=Z39.88-2004&rft_val_fmt=info:ofi/fmt:kev:mtx:journal&rft_id=info:pmid/16646082&rft.genre=article", type: "article" },
];

for (var i = 0; i < queries.length; i++) {
    link360.getMetadata({
        query: queries[i].query,
        type: queries[i].type,
        notFound : function (xmlDoc) { 
            println("not found: " + this.query);
        },
        foundNoFullText : function (xmlDoc) { 
            println("found, but no full text for '" + this.query + "'\n"
                + xmlDoc.saveXML(xmlDoc.documentElement));
        },
        hasFullText : function (xhr, url, databaseName) { 
            println("Query: " + this.query);
            println("Full Text via " + databaseName + " at " + url);
        }
    });
}

println("waiting for 4 seconds...");
java.lang.Thread.sleep(4000);
println("done.");

