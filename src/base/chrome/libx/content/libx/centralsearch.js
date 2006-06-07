/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is LibX Firefox Extension.
 *
 * The Initial Developer of the Original Code is Annette Bailey (libx.org@gmail.com)
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer and Virginia Tech. All Rights Reserved.
 *
 * Contributor(s): Godmar Back (godmar@gmail.com)
 *
 * ***** END LICENSE BLOCK ***** */


// Support for Serial Solutions' Central Search
function CentralSearch(catprefix) {
    this.ssLibHash = libxGetProperty(catprefix + "centralsearch.ssLibHash");
    this.searchBy = libxGetProperty(catprefix + "centralsearch.searchBy");
    if (this.searchBy == "Category") {
        this.catIDs = "catID=" + libxGetProperty(catprefix + "centralsearch.catIDs").replace(/;/g, "&catID=");
        this.catGroupIDs = "catGroupID=" + libxGetProperty(catprefix + "centralsearch.catGroupIDs").replace(/;/g, "&catGroupID=");
    } else {
        this.dbIDList = "dbIDList=" + libxGetProperty(catprefix + "centralsearch.dbIDList");
    }
}

CentralSearch.prototype = new libxCatalog();

libxAddToPrototype(CentralSearch.prototype, {
/*
    Search Types:
<option selected="selected">Title</option>
                <option>Author</option>
                <option>Full Text</option>
                <option>Keyword</option>

                <option>Subject</option>
                <option>Abstract</option>
                <option>ISBN</option>
                <option>ISSN</option>
                <option>Any</option>
*/

	convert: function (stype) {
	    switch (stype) {
	        case 'd':   return "Subject";
	        case 'a':   return "Author";
	        case 't':   return "Title";
            case 'is':  return "ISSN";
	        case 'i':   return "ISBN";
	        case 'Y':   return "Keyword";
            // also supported: Full Text, Abstract, and Any
	        default:
	            return "Any";
	    }
	},
	supportsSearchType: function (stype) {  
	    return true;
	},
    /*
    Basic:
    http://demo.cs.serialssolutions.com/results?SS_LibHash=KA9YH9GR5U&dbIDList=&searchType=basic&catGroupList=default&searchBy=Category&field=Title&term=india&catID=all&catID=10809&catGroupID=10810&catID=10811&catID=10812&catID=10813&catID=10814&catID=10815&catID=10816&catID=10818&catID=10819&catID=10820&catID=10821&catID=10822&catID=10823&catID=10824&catID=10825&catID=10826&catID=10829&catID=10830&catID=10831&catID=11947&catID=14322

    or by database:
    http://demo.cs.serialssolutions.com/results?SS_LibHash=KA9YH9GR5U&dbIDList=all,PAD,EAS,PAT,AEA,EAL,AFU,CBR,CBS,WAS,WAR,AKX,IBG,WBA,RSY,WBR,IBR,EBR,ECL,AUJ,CCG,ECC,ECI,AYJ,ECE,ICD,ECS,BBI,ICQ,BCT,PCJ,AMR,CCT,BHS,CCU,PED,CSU,CCZ,CDE,BNH,ENW,IEA,IGG,WGS,BVM,IHW,EHC,EHN,CBE,PHN,CHS,RIE,IOF,ANW,MIN,CIM,CIP,CLX,CMP,ILT,CLO,CLR,ESE,EMH,UGV,EMI,CDG,ENS,CDN,ENC,ROX,DGT,CPC,IPC,RPD,PQF,PQC,PML,PSN,NN1,PNJ,PSK,EPS,PSJ,EBW,PQT,DIE,CDP,EFU,RWI,&searchType=basic&catGroupList=default&searchBy=Database&field=Title&term=india

    */
	makeSearch: function(stype, sterm) {
        return this.url + "/results?SS_LibHash=" + this.ssLibHash 
            + (this.dbIDList ? ("&" + this.dbIDList) : "")
            + "&searchType=basic&catGroupList=default" 
            + "&searchBy=" + this.searchBy
            + "&field=" + this.convert(stype) + "&term=" + sterm
            + (this.catIDs ? ("&" + this.catIDs) : "");
            + (this.catGroupIDs ? ("&" + this.catGroupIDs) : "")
            ;
	},
    /*
    Advanced:
    http://demo.cs.serialssolutions.com/results?SS_LibHash=KA9YH9GR5U&dbIDList=&catGroupList=default&searchType=advanced&searchBy=Category&term0=india&field0=Title&boolop1=And&term1=bears&field1=Keyword&boolop2=And&term2=&field2=Title&boolop3=And&term3=&field3=Title&boolop4=And&term4=&field4=date&catGroupID=10810
    */
	makeAdvancedSearch: function(fields) {
        var url = this.url + "/results?SS_LibHash=" + this.ssLibHash 
            + "&catGroupList=default"   // is this correct ???
            + "&searchType=advanced"
            + "&searchBy=" + this.searchBy
            + (this.dbIDList ? ("&" + this.dbIDList) : "")
            ;
		for (var i = 0; i < fields.length; i++) {
            if (i > 0) {
                url += "&boolop" + (i) + "=And";
            }
			url += "&field" + (i) + "=" + this.convert(fields[i].searchType) 
                + "&term" + (i) + "=" + fields[i].searchTerms;
		}
        url += this.catIDs ? ("&" + this.catIDs) : "";
        url += this.catGroupIDs ? ("&" + this.catGroupIDs) : "";
		return url;
	}
});

// vim: ts=4