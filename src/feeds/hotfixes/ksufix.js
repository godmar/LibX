// The following hotfix is taken from http://www.lib.k-state.edu/js/input.js
// based on Dale Askey's suggestion

//Script to insert AND into keyword searches. Implemented 4/20/2006.
//Original source code is
//copyright Regents of the University of California 2004,
//picked up with modifications from Yale University in 2006 (thanks, Kalee).

//Now extensively modified and condensed by Harish Maringanti at Kansas
//State University, 2006. Specific modifications include adding the ability to
//handle hyphenated terms, e.g.-Levi-Strauss, as well as terms joined by an ampersand.

//Other changes address handling searches that include explicit MARC fields (e.g.- 100A)
//as well as those Voyager index names (e.g.- TKEY), even though we think that less than
//.00005% of humanity knows how to do those searches! While the UCLA/Yale versions address
//this, Harish significantly condensed the code.


//Code below copyright Kansas State University, 2006. We like to share, though, so
//just ask and it's yours.

// insertAND does the basic function of inserting AND between terms for a keyword
// search and handles:
// Characters like &, | , and, or, not; all case insensitive wherever applicable
// The hypenated strings are inserted in quotes. eg: levi-strauss => "levi-strauss"
// Parantheses are addressed: All above should hold good inside parantheses in
// addition to being insensitive to spaces between (,) & any strings.

// Sample queries:
// var s="One two \"three four\" five six";
// var s = "xml ( databases | levi-strauss ) & \"computer\"\"science\"";

if (libxEnv.getBoolPref ('libx.ksufixtest', false))
(function () {

function insertAND(s) {

    // handle the parenthesis cases, we are forcing a space between brackets and terms.
    s = s.replace(/(\(|\))/g," $1 ");

    // Pick out words from the input query. Treat phrases as a single word.
    // used [a-zA-Z0-9_-] instead of \w since we need -&?(),etc

    // Fix to allow diacritics in query
    // var r=/(\"[^"]*\"|[a-zA-Z0-9_\-\)\(\?\&\']+)/g;
    var r=/(\"[^"]*\"|\S+)/g;
    // end of diacritic fix
    s=s.replace(r,"$1#");
    var a=s.split("#");
    var len = a.length - 1;

    // str will have the new modified query
    var str = "";

    //pword is to indicate if 'AND' needs to be inserted for a particular word.
    // Eg: pword would be set for words such as and,or,not where in no 'AND' is needed.
    var pword = 0;

    // Parsing through each of the input words individually
    for(var i=0;i<len;i++){

        //Test for words starting with quotes
        if(a[i].match(/^\s*"/)){
            if(i == 0 || pword == 1){
                str = str + a[i];
                pword = 0;
            }
            else{
                str = str + " AND " + a[i];
            }
        }
        // Implies words with no quotes
        else {
            // Test if the word matches - and, or, not
            if (a[i].match(/^\s*and\s*$/i)){
                if (pword == 1) {}
                else {
                    str = str + "AND";
                    pword = 1;
                }
            }
            else if(a[i].match(/^\s*or\s*$/i)){
                if (pword == 1){}
                else {
                    str = str + "OR";
                    pword = 1;
                }
            }
            else if(a[i].match(/^\s*not\s*$/i)){
                str = str + "NOT";
                pword = 1;
            }
            // If & exists by itself then combine the pre & post terms and treat as a phrase
            else if(a[i].match(/&/)){
                str = str.replace(/\s*([a-zA-Z0-9_\-\(\)\?]+)\s+$/," \"$1");
                str = str + " & " + a[i+1] + "\" ";
                i++;
            }
            // Looking for some keywords
            else if (a[i].match(/(^\s*GKEY\s*$|^\s*IALL\s*$|^\s*ISBN\s*$|^\s*ISSN\s*$|^\s*JKEY\s*$|^\s*KPPD\s*$|^\s*LSUB\s*$|^\s*NKEY\s*$|^\s*NOTE\s*$|^\s*SERI\s*$|^\s*SKEY\s*$|^\s*TKEY\s*$|^\s*\d{3}[ABCKLNT]\s*$)/)) {
                if (pword == 1 || i == 0) {
                    str = str + a[i];
                }
                else {
                    str = str + " AND " + a[i];
                }
                pword = 1;
            }
            // Handling paranthesis
            else if(a[i].match(/\(/)){
                if(pword == 1 || i == 0) {
                    str = str + " (";
                }
                else {
                    str = str + " AND" + " (";
                    pword = 1;
                }
                if (i == 0) {
                    pword = 1;
                }
            }
            else if(a[i].match(/\)/)){
                str = str + ")";
                pword = 0;
            }
            // Look for hypenated terms and put them in quotes.
            else if(a[i].match(/-/)){
                if (pword == 1 || i == 0) {
                    str = str + "\"" + a[i] + "\"";
                    pword = 0;
                }
                else {
                    str = str + " AND " + "\"" + a[i] + "\"";
                }
            }
            // all other cases
            else {
                if(i == 0 || pword == 1){
                    str = str + a[i];
                    pword = 0;
                }
                else {
                    str = str + " AND " + a[i];
                }
            }
        } // Closing else for no quote words
        str = str + " ";
    }
    return str;
}

var editionId = libxEnv.xmlDoc.getAttr("/edition", "id");
var cat0 = libx.edition.catalogs[0];

if (editionId != "C46EFD6B" || cat0.name != "K-State Libraries Catalog") {
    return;
}

libxEnv.writeLog("applying Dale Askey's KSU fix");

cat0.options = "Y;" + cat0.options;
cat0.relevanceranking = false;
cat0.keyword = "CMD";
var oldSearch = cat0.makeSearch;
cat0.makeSearch = function(stype, sterm) {
    if (stype == 'Y')
        sterm = insertAND(sterm);

    return oldSearch.call(cat0, stype, sterm);
}
libxActivateCatalogOptions(libxSelectedCatalog);

})();

