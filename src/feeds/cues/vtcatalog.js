if (libraryCatalog.sid == "libxvt")   // only for VT edition
new libxEnv.doforurls.DoForURL(libraryCatalog.urlregexp, function (doc) {
    // find all <tr> where the first <td> child says "Newman Library"
    // and the third <td> child says "AVAILABLE"
    var availrows = libxEnv.xpath.findNodesXML(doc, '//tr[     td[3] / text()[contains(.,"AVAILABLE")] '
                                      + '      and td[1] / text()[contains(.,"Newman Library")]]');
    for (var i = 0; i < availrows.length; i++) {
        // find the second <TD> child, relative to ith <TR>
        var callno = libxEnv.xpath.findSingleXML(doc, "td[2]", availrows[i]).textContent;




        callno = callno.replace(/^\s*/, "");


        var floorno = 0;

        if (callno.match(/^[A-Ea-e]/)) {//if call number begins with A-E, then link to 2nd floor map
            floorno = 2;
        }
        if (callno.match(/^[F-Pf-p]/)) {//if call number begins with F-P, then link to 3rd floor map
            floorno = 3;
        }
        if (callno.match(/^[Q-Sq-s]/)) {//if call number begins with Q-S, then link to 4th floor map
            floorno = 4;
        }
        if (callno.match(/^[T-Zt-z]/)) {//if call number begins with T-Z, then link to 5th floor map
            floorno = 5;
        }
        var hasISSN = libxEnv.xpath.findSingleXML(doc, "//td[@class='bibInfoLabel' and contains(text(),'ISSN')]");
        if (doc.body.textContent.match(/Periodicals/i) || hasISSN) {
            floorno = 4;
        }
        
        var vtlogo = makeLink(doc, "Book is on floor " + floorno + ", click for map", "http://www.lib.vt.edu/help/direct/tour/floor" + floorno + "/map" + floorno + ".html");
                    
        if (floorno == 0) {
            vtlogo = makeLink(doc, "Unable to determine book location!", "http://www.lib.vt.edu/help/direct/tour/");
        }
        
        var lasttd = libxEnv.xpath.findSingleXML(doc, "td[3]", availrows[i]);
        lasttd.appendChild(doc.createTextNode(" "));
        lasttd.appendChild(vtlogo);
    }
});
