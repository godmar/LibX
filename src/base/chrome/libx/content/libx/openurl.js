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

/** 
 * OpenURL Resolver Support
 * 
 * Author: Annette Bailey <annette.bailey@gmail.com>
 *         Godmar Back <godmar@gmail.com>
 *
 * Most of OpenURL's functionality is standardized, such as the transport used to run
 * a OpenURL query against a resolver.  However, there are peculiarities: some resolvers
 * only support articles, some require certain fields.
 *
 * OpenURL implements properties that we expect to be common to all OpenURL
 * resolvers.  It provides a fully functioning implementation.
 *
 * ArticleLinker and SFX are subclasses that inherit from OpenURL and provide
 * functionality specific to the Serials Solutions's Article Linker product
 * and the SFX product.
 * @namespace
 */
libx.openurl = { 
    // maps OpenURL types (generic, sfx, etc.) to classes
    /**
     *	Used to instantiate the various openurl types
     *	All openurl types are accessed by there lowercase class names
     *	@example
     *		var alephCatalog = new libx.factory["webbridge"] ()
     */
    factory : { }
};

/**
 *	Generic Base Class implementation for OpenURL	
 *	@name libx.openurl.Generic
 *	@private
 *	@constructor
 */
libx.openurl.factory["webbridge"] =
libx.openurl.factory["generic"] = libx.core.Class.create(
/**@lends libx.openurl.Generic.prototype */
{
    include: [ libx.catalog.CatalogUtils ],

	/**
	 *	Constructs an OpenURL from a number of fields
	 */
    makeOpenURLFromFields: function(/**Object*/fields) {
	    var url = "__char_set=utf8";
	    this.haveTitleOrIssn = false;
        if (this.version == "0.1") {
            this.genreprefix = "genre=";
            this.doiprefix = "id=doi:";
            this.pmidprefix = "id=pmid:";
            this.titleprefix = "title=";
            this.jtitleprefix = "title=";
            this.btitleprefix = "title=";
            this.atitleprefix = "atitle=";
            this.isbnprefix = "isbn=";
            this.issnprefix = "issn=";
            this.aulastprefix = "aulast=";
            this.aufirstprefix = "aufirst=";
        } else {
            this.genreprefix = "rft.genre=";
            this.doiprefix = "rft_id=info:doi/";
            this.pmidprefix = "rft_id=info:pmid/";
            this.jtitleprefix = "rft.jtitle=";
            this.btitleprefix = "rft.btitle=";
            this.atitleprefix = "rft.atitle=";
            this.isbnprefix = "rft.isbn=";
            this.issnprefix = "rft.issn=";
            this.aulastprefix = "rft.aulast=";
            this.aufirstprefix = "rft.aufirst=";
        }
	    for (var i = 0; i < fields.length; i++) {
            this.adjustISNSearchType(fields[i]);
            url += "&";
		    switch (fields[i].searchType) {
		    case 'doi':
                url += this.doiprefix + fields[i].searchTerms;
                break;
		    case 'pmid':
                url += this.pmidprefix + fields[i].searchTerms;
                break;
		    case 'jt':
		    case 't':
                if (fields[i].searchType == 'jt') {
                    url += this.jtitleprefix;
                } else {
                    url += this.btitleprefix;
                }

                url += encodeURIComponent(fields[i].searchTerms.replace(/\s+/, " "));
			    this.haveTitleOrIssn = true;
			    break;
		    case 'at':
			    url += this.atitleprefix + encodeURIComponent(fields[i].searchTerms.replace(/\s+/, " "));
			    break;
		    case 'i':
                var pureISN = isISBN(fields[i].searchTerms, this.downconvertisbn13);
			    if (pureISN != null) {
				    url += this.isbnprefix + pureISN;
			    } else {
				    alert(libxEnv.getProperty("openurlissn.alert", [fields[i].searchTerms]));
				    return null;
			    }
			    this.haveTitleOrIssn = true;
			    break;
		    case 'is':
                var pureISN = isISSN(fields[i].searchTerms);
			    if (pureISN != null) {
				    url += this.issnprefix + pureISN;
			    } else {
				    alert(libxEnv.getProperty("openurlissn.alert", [fields[i].searchTerms]));
				    return null;
			    }
			    this.haveTitleOrIssn = true;
			    break;
		    case 'a':
			    var sterm = fields[i].searchTerms;
			    var hasComma = sterm.match(/,/);
			    sterm = sterm.replace(/[^A-Za-z0-9_\-\s]/g, " ");
			    var names = sterm.split(/\s+/);
			    if (names.length == 1) {// if author is single word, use as aulast field
				    url += this.aulastprefix + encodeURIComponent(names[0]);
			    } else {// if author name is multiple words, see in which order to use fields
				    if (hasComma || names[names.length-1].match(/^[A-Z][A-Z]?$/i)) {// assume it is already last, first middle
					    url += this.aulastprefix + encodeURIComponent(names[0]);
					    url += this.aufirstprefix + encodeURIComponent(names[1]);
					    // XXX do not discard middle names/initials 2 and up
				    } else {
					    url += this.aulastprefix + encodeURIComponent(names[names.length-1]);
					    url += this.aufirstprefix + encodeURIComponent(names[0]);
					    // XXX do not discard middle names/initials 1 through names.length-2
				    }
				    // XXX investigate if we need to properly set auinit, auinit1, and auinitm here
				    // if authors first name is abbreviated
			    }
			    break;
		    case 'Y':
			    alert(libxEnv.getProperty("openurlarticlekeyword.alert", 
                                    [this.name]));
			    return null;
			}//switch
	    }//for
        return this.addSid(url);
    },
    /**
     * Add a sid, using syntax according to version (0.1 or 1.0)
     * If version is not provided, fall back to this.version
     * 
     * Note that some OpenURL 1.0 resolvers need to fall back to 0.1
     * to properly rewrite Google Scholar OpenURLs.  True as of 10/26/07.
     */
    addSid: function (/**String*/url, /**String*/version) {
        if (version == null)
            version = this.version;

        if (version == "0.1") {
            this.sidprefix = "sid=";
        } else {
            this.sidprefix = "rfr_id=info:sid/";
        }

        /* append correct sid
         * to support flaky systems such as WB, which support only one global
         * identifier lookup per sid, we append a different sid
         * if this OpenURL contains a DOI if so configured.
         */
        url += "&" + this.sidprefix;
        var sid = this.sid;
        if (this.pmidsid != null && url.match(/pmid/i)) {
            sid = this.pmidsid;
        } else
        if (this.xrefsid != null && url.match(/doi/i)) {
            sid = this.xrefsid;
        }

        try {
            sid = sid.replace(/%hostname%/, libxEnv.getCurrentWindowContent().location.hostname);
        } catch (er) {
            libxEnv.writeLog(er + ": exception occurred attempting to replace %hostname%", 'openurl');
        }
        url += encodeURIComponent(sid);
        return url;
    },
    makeOpenURLSearch: function(fields) {
        var path = this.makeOpenURLFromFields(fields);

        /*
        Values for genre:
            book
            bookitem
            report
            document
            issue
            article
            proceeding
            conference
            preprint
            unknown
        See: http://www.openly.com/1cate/igbook.html
        and  http://www.openly.com/1cate/ig.html
        But: http://alcme.oclc.org/openurl/servlet/OAIHandler/extension?verb=GetMetadata&metadataPrefix=mtx&identifier=info:ofi/fmt:kev:mtx:journal
        lists genre=journal as well.
        */

        /* Find a suitable genre */
        var genre = "unknown";
        if (path.indexOf(this.atitleprefix) != -1 
            || path.indexOf(this.doiprefix) != -1 
            || path.indexOf(this.pmidprefix) != -1)
            genre = "article";
        else if (path.indexOf(this.isbnprefix) != -1)
            genre = "book";
        else if (path.indexOf(this.issnprefix) != -1 || path.indexOf(this.jtitleprefix) != -1)
            genre = "journal";

        if (this.version == "1.0") {
            switch (genre) {
            case "book":
                path = "url_ver=Z39.88-2004&rft_val_fmt=info:ofi/fmt:kev:mtx:book&" + path;
                break;
            default:
                path = "url_ver=Z39.88-2004&rft_val_fmt=info:ofi/fmt:kev:mtx:journal&" + path;
                break;
            }
        }
        return this.url + "?" + path + "&" + this.genreprefix + genre;
    },
    makeOpenURLForISSN: function(issn) {
        return this.makeOpenURLSearch([ { searchType: 'is', searchTerms: issn } ]);
    },
    makeOpenURLForDOI: function(doi) {
        return this.makeOpenURLSearch([ { searchType: 'doi', searchTerms: doi } ]);
    },
    makeOpenURLForPMID: function(pmid) {
        return this.makeOpenURLSearch([ { searchType: 'pmid', searchTerms: pmid } ]);
    },
    completeOpenURL: function(path, version) {
        var url = this.url + "?" + path;
        return this.addSid(url, version);
    },
    // implement searchable catalog functionality
    options: "jt",  // if used as a search catalog, show only Journal Title by default
    search: function (fields) {
        var url = this.makeOpenURLSearch(fields);
        if (url) {
            libxEnv.openSearchWindow(url);
        }
    },
    /**
     * the default implementation looks at the options property
     * to decide which options are supported.
     */
    supportsSearchType: function (stype) {
        return (";" + this.options + ";").match(";" + stype + ";");
    }
});

// ---------------------------------------------------------------------------------
// Article Finder is a subclass of OpenURL
// 
/**
 *	@name libx.openurl.Sersol
 *	@constructor
 *	@augments libx.openurl.Generic
 *	@private
 */
libx.openurl.factory["sersol"] = libx.catalog.factory["sersol"] = libx.core.Class.create(libx.openurl.factory["generic"], 
/** @lends libx.openurl.Sersol.prototype */
{


    // if used as a search catalog, show only Journal Title + ISBN/ISSN
    options : "jt;i",

    makeOpenURLSearch : function (fields) {
        // if the user specifies only the journal title/issn, use sersol's search function
        if (fields.length == 1) {
            this.adjustISNSearchType(fields[0]);
            var stype = fields[0].searchType;
            if (stype == 'jt') {
                // http://su8bj7jh4j.search.serialssolutions.com/?V=1.0&S=T_W_A&C=business
                return this.url + '?V=1.0&S=T_W_A&C=' + encodeURIComponent(fields[0].searchTerms);
            }
            if (stype == 'is') {
                return this.url + '?V=1.0&S=I_M&C=' + encodeURIComponent(fields[0].searchTerms);
            }
        }

        return this.parent(fields);
    }
});


/**
 *	SFX OpenURL Support
 *	@name libx.openurl.SFX
 *	@augments libx.openurl.Generic
 *	@private
 *	@constructor
 */
libx.catalog.factory["sfx"] =
libx.openurl.sfx = libx.core.Class.create(libx.openurl.factory["generic"], 
/** @lends libx.openurl.SFX.prototype */
{
    makeOpenURLSearch : function (fields) {
        var url = this.parent(fields);   
        if (url == null)
            return null;

        /* SFX appears to look at the genre when deciding how to interpret 
         * the other fields.  This should now be handled correctly in makeOpenURLSearch.
         *
         * The other adjustments were found via debugging in 2005; 
         * do they still apply?
         */
        for (var i = 0; i < fields.length; i++) {
            switch (fields[i].searchType) {
            case 'jt':
                url += "&sfx.title_search=contains";
                /* FALL THROUGH */
            case 'is':
                url += "&sfx.ignore_date_threshold=1";
                break;
            }
        }
        return url;
    }
});


/**
 *	OCLC Gateway support
 *	
 *	Includes support to automatically retrieve a personalized icon based
 *	on the users current location
 *
 *	@name libx.openurl.OCLCGateway
 *	@augments libx.openurl.Generic
 *	@private
 *	@constructor
 */
libx.openurl.OCLCGateway = libx.core.Class.create(libx.openurl.factory["generic"], 
/** @lends libx.openurl.OCLCGateway */
{
    url : "http://worldcatlibraries.org/registry/gateway",
    name : "OCLC Gateway",
    sid : "libx:oclcgateway",
    initialize: function () {
        var thisOpenURL = this;

        libxEnv.getXMLDocument ( "http://worldcatlibraries.org/registry/lookup?IP=requestor",
            function ( xmlhttprequest ) {
                var doc = xmlhttprequest.responseXML;
                try {
                    var link = doc.getElementsByTagName ( 'linkIcon' )[0].firstChild.nodeValue;
                    thisOpenURL.image = link;
                } catch (e) { /* ignore */ }
        } );
    }
});

/*
<?xml version="1.0" encoding="UTF-8"?>
<records xmlns="http://worldcatlibraries.org/registry" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://worldcatlibraries.org/registry http://worldcatlibraries.org/registry/resolver/ResolverRecords.xsd"><resolverRegistryEntry xmlns="http://worldcatlibraries.org/registry/resolver" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://worldcatlibraries.org/registry/resolver http://worldcatlibraries.org/registry/resolver/Resolver.xsd">
  <institutionName>VIRGINIA TECH</institutionName>
  <IPAddressRange>128.173.*.*</IPAddressRange>
  <IPAddressRange>198.82.*.*</IPAddressRange>
  <IPAddressRange>192.101.20.*</IPAddressRange>
  <IPAddressRange>208.22.18.*</IPAddressRange>
  <IPAddressRange>208.27.104.*</IPAddressRange>
  <IPAddressRange>208.29.54.*</IPAddressRange>
  <IPAddressRange>208.30.170.*</IPAddressRange>
  <IPAddressRange>208.22.128-159.*</IPAddressRange>
  <IPAddressRange>206.105.198.105-149</IPAddressRange>
  <IPAddressRange>208.17.194.64-217</IPAddressRange>
  <OCLCInstSymbol>VPI</OCLCInstSymbol>
  <InstitutionID>5027</InstitutionID>
  <resolver>
    <resolverID>1939615960</resolverID>
    <source>FirstSearch</source>
    <baseURL>http://SU8BJ7JH4J.search.serialssolutions.com/</baseURL>
    <linkIcon>http://www.lib.vt.edu/images/getvtext.gif</linkIcon>
    <linkText> </linkText>
    <OpenURLVersions>
      <OpenURL_0.1/>
    </OpenURLVersions>
    <vendor>serialsSolutions</vendor>
    <OpenURL_0.1_Identifiers>
      <doi/>
      <pmid/>
      <bibcode/>
      <oai/>
    </OpenURL_0.1_Identifiers>
    <OpenURL_0.1_genres>
      <journal/>
      <article/>
    </OpenURL_0.1_genres>
  </resolver>
</resolverRegistryEntry>
</records>
*/

// vim: ts=4
