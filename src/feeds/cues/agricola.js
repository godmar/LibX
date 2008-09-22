// --------------------------------------------------------------------------------------------------
// On agricola record pages, add link next to call number

new libxEnv.doforurls.DoForURL(/agricola\.nal\.usda\.gov/, doAgricola, null, "agricola");

function doAgricola(doc) {
    // find a <TR> that has a <TH> child whose textContent is equal to 'Call Number:'
    var cn_tr = $("tr th").filter(":contains('Call Number:')");

    // starting relative to this <TR>, find the first <TD> child with an <A> grandchild and select the <A> - that's the hyperlinked call number
    var cn_aNode = cn_tr.next("td").children("a");

    var cn_a = cn_aNode.contents()[0];
    var cn = cn_a.nodeValue;

    var link = libxEnv.makeLink(doc, libxEnv.getProperty("callnolookup.label", [libraryCatalog.name, cn]), libraryCatalog.makeCallnoSearch(cn), libraryCatalog);
    // insert cue after <A> element within the containing <TD> element
    cn_a.parentNode.insertBefore(link, cn_a.nextSibling);
    animateCue(link);
}
