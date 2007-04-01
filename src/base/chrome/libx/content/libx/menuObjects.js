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
 *                 Michael Doyle ( vtdoylem@gmail.com )
 *
 * ***** END LICENSE BLOCK ***** */



/*
 * Initilize Function for all Context Menu Objects
 * 
 * Anything declared with a label of "DEFAULT" will always be checked to be displayed
 * 
 * Anything declared with any other label with only be displayed if something that was declared
 * 		before it with the same label is not displayed 
 *			( ie, if ISBN is displayed, then ISSN, PMID, and Title/Author/Keyword 
 *			  searches are not checked, however the DOI check is always run )
 *		
 *
 *	Currently the following Context MenuObjects are declared:
 *
 *	DEFAULT:
 *		DOISearch -- Search for DOIs is always done
 *      
 *
 *	Libx:
 *		1. ISBN/XISBN search
 *		2. ISSN search
 *		3. PMID search
 *		4. Title/Author/Keyword search
 *		
 * ************************ Please Note ****************************
 *  The order that menu objects are created affects the order that they appear on the context menu
 *  as well as the order they are evaluated in at this time! So be careful as to where you declare new MenuObjects
 *		- Currently all menu objects are inserted right before the EZ-Proxy object, which appears at the bottem
 *		  of the libx context menu. 		
 */
function libxInitializeMenuObjects() 
{
    // trim a string
    function trim(s) 
    {
        return s.replace(/^\s*/, "").replace(/\s*$/, "");
    }
	
	/********************** Initilizes the Default label ********************************/
	LibxLabels.push ( "DEFAULT" );
	LibxMenuItems["DEFAULT"] = new Array();
	/*********************** Do Not Remove/Modify ***************************************/

    // apply a heuristic to transform an author search.
    function transformAuthorHeuristics(sterm) {
        var hasComma = sterm.match(/,/);
	
        // split author into names, turns "arthur conan doyle" into ["arthur", "conan", "doyle"]
        var names = sterm.split(/\s+/);
        // switch author's first and last name unless there's a comma or the last name is an initial
        if (!hasComma && !names[names.length-1].match(/^[A-Z][A-Z]?$/i)) {
            sterm = names[names.length-1] + " " + names.slice(0,names.length-1).join(" ");
            // creates "doyle arthur conan"
        }
        return sterm;
    }

    function searchBy(stype, sterm) {
        libraryCatalog.search([{searchType: stype, searchTerms: sterm}]);
    }

	/*********************** ISBN/XISBN options *****************************************/
	
	LibxContextMenuObject ( [ { id:"libx-isbn-search", hidden:"true" }, 
                              { id:"libx-xisbn-search", hidden:"true" } ], 
                            "libx",
                            function(p) { 
                                if (p.isTextSelected()) 
                                    return isISBN(p.getSelection()); 
                                else 
                                    return null; 
                            },
                            ISBNAction );

	function ISBNAction ( pureISN, menuObjects ) {
		menuObjects[0].setAttribute ( "label", libxGetProperty("isbnsearch.label", [libraryCatalog.name, pureISN]) );
		menuObjects[1].setAttribute ( "label", libxGetProperty("xisbnsearch.label", [pureISN]) );

        libxEnv.setObjectVisible(menuObjects[0], true);
        menuObjects[0].docommand = function () {
            searchBy('i', pureISN);
        };

		if (libraryCatalog.xisbn.opacid) {   // only true if xISBN is supported for this catalog
            libxEnv.setObjectVisible(menuObjects[1], true);
            menuObjects[1].docommand = function () {
		    	libxEnv.openSearchWindow(libraryCatalog.makeXISBNRequest(pureISN));
            };
		}
	}
	
	/*********************************** ISSN options *******************************************/
	var openurlissnsearch = [{ id:"libx-issn-search", hidden:"true" },
                             { id:"libx-openurl-issn-search", hidden:"true" }];
	
	LibxContextMenuObject ( openurlissnsearch, "libx",
                            function(p) { 
                                if (p.isTextSelected()) 
                                    return isISSN(p.getSelection()); 
                                else 
                                    return null; 
                            },
                            ISSNAction );
	
	function ISSNAction ( pureISN, menuObjects ) {
		var issnsearch = menuObjects[0];
		issnsearch.setAttribute ( "label", libxGetProperty("issnsearch.label", [libraryCatalog.name, pureISN]) );
		libxEnv.setObjectVisible(issnsearch, true);
        issnsearch.docommand = function () {
            searchBy('i', pureISN);
        };
		if (libxEnv.openUrlResolver) {
		    menuObjects[1].setAttribute ( "hidden", false );
		    menuObjects[1].setAttribute ( "label", libxGetProperty("openurlissnsearch.label", [libxEnv.openUrlResolver.name, pureISN] ) );
            menuObjects[1].docommand = function () {
                libxEnv.openSearchWindow(libxEnv.openUrlResolver.makeOpenURLForISSN(pureISN));
            };
		}		
	}
	
	/********************************* PMID Options **********************************************/
	var pmidsearch = [{id:"libx-pmid-search", hidden:"true" }];
	
	LibxContextMenuObject ( pmidsearch, "libx",
		function(p) { 
            if (p.isTextSelected()) 
                return isPMID(p.getSelection()); 
            else 
                return null; 
        },
		PMIDAction );
	
	function PMIDAction ( pmid, menuObjects ) {
		if (libxEnv.openUrlResolver) {
			menuObjects[0].setAttribute ( "label", libxGetProperty("openurlpmidsearch.label", [libxEnv.openUrlResolver.name, pmid]) );
			libxEnv.setObjectVisible (menuObjects[0], true);
			menuObjects[0].docommand = function () {
                libxEnv.openSearchWindow(libxEnv.openUrlResolver.makeOpenURLForPMID(pmid));
            };
		}
	}
	
	// does this selection contain a pubmed id?
	function isPMID(s) {
		if ( libxEnv.openUrlResolver ) {
			var m = s.match(/PMID[^\d]*(\d+)/i);
		    if (m != null) {
		        return m[1];
		    }
		    m = s.match(/PubMed\s*ID[^\d]*(\d+)/i);
		    if (m != null) {
		        return m[1];
		    }
		}
	    return null;
	}
	
	/*********************************** Author/Title/Keyword search *******************************************/
	
	var libxMenuItems = [{id:"libx-keyword-search", label:""},
                         {id:"libx-title-search", label:""},
                         {id:"libx-author-search", label:""},
                         {id:"libx-magic-search", hidden:"true" }];
	 	
	LibxContextMenuObject ( libxMenuItems, "libx", isTextSelected, DEFAULTAction );
	
    function isTextSelected ( p ) {
        var sterm = p.getSelection();
        if ( !sterm )
            return null;

        // clean up search term by removing unwanted characters
        // should leave &, and single apostrophe in - what about others?
        // and replaces multiple whitespaces with a single one
        // use :alnum: to avoid dropping diacritics and other Unicode alphanums
        // as per Ted Olson
        return sterm.replace(/[^[:alnum:]_&:\222\'\-\s/g, " ").replace(/\s+/g, " ");
	}
	
	// don't show keyword, title, author if ISSN/ISBN or PMID was recognized
	function DEFAULTAction ( p, menuObjects ) 
	{
		p = trim(p);
        var displayText = p.length > 25 ? p.substr ( 0, 25 ) + "..." : p;
		
		menuObjects[0].setAttribute ( "label", libxGetProperty("contextmenu.keywordsearch.label", [libraryCatalog.name, displayText]) );
        libxEnv.setObjectVisible(menuObjects[0], true);
        menuObjects[0].docommand = function () {
            searchBy('Y', p);
        };

        menuObjects[1].setAttribute ( "label", libxGetProperty("contextmenu.titlesearch.label", [libraryCatalog.name, displayText]) );
        libxEnv.setObjectVisible(menuObjects[1], true);
        menuObjects[1].docommand = function () {
            searchBy('t', p);
        };

        var ap = transformAuthorHeuristics(p);
        var adisplayText = ap.length > 25 ? ap.substr ( 0, 25 ) + "..." : ap;
        menuObjects[2].setAttribute ( "label", libxGetProperty("contextmenu.authorsearch.label", [libraryCatalog.name, adisplayText]) );
        libxEnv.setObjectVisible(menuObjects[2], true);
        menuObjects[2].docommand = function () {
            searchBy('a', ap);
        };
        
        libxEnv.setObjectVisible(menuObjects[3], true);
		menuObjects[3].setAttribute ( "label", libxGetProperty("contextmenu.scholarsearch.label", [displayText] ) );
        menuObjects[3].docommand = function () {
            magicSearch(p);
        };
    }
    
    /*********************************** DOI options ( always checked ) *******************************************/
	var doisearch = [{id:"libx-doi-search", hidden:"true"}];
	LibxContextMenuObject ( doisearch, "DEFAULT", isDOIF, DOIAction );
	
	function isDOIF ( p ) {
		if (!libxEnv.openUrlResolver) {
            return null;
        }
		if (p.isOverLink()) {
            //does href of hyperlink over which user right-clicked contain a doi?
			return isDOI(decodeURI(p.getNode().href));
		} else 
        if (p.isTextSelected()) {
			return isDOI(p.getSelection());
		}		
        return null;
	}
	
	// DOI displays in addition to keyword, title, author
	function DOIAction ( doi, menuObjects ) {
        menuObjects[0].setAttribute ( "label", libxGetProperty("openurldoisearch.label", [libxEnv.openUrlResolver.name, doi]) );
        libxEnv.setObjectVisible(menuObjects[0], true);
        menuObjects[0].docommand = function () {
            libxEnv.openSearchWindow(libxEnv.openUrlResolver.makeOpenURLForDOI(doi));
        };
	}	
	
	/********************************* Proxy Options **********************************************/
	var libxProxyObj = [{id:"libx-proxify"}];
	
	LibxContextMenuObject ( libxProxyObj, "Libx-Proxy", isProxyActive, showProxyMenuItems );
	
    // match function: display always, if a proxy is defined.
    // p is of type PopupHelper.
	function isProxyActive( p )
	{
		if (libxProxy)
			return p;
	    else
	    	return null;
    }
    
    /*
     * This function is called when the user hits reload this page/follow a link
     * through the proxy.  
     */
    function doProxify(p, proxy) {
        if (p.isOverLink()) {
            var href = p.getNode().href;
            libxEnv.openSearchWindow(proxy.rewriteURL(href));
        } else {
            _content.location.href = proxy.rewriteURL(_content.location.toString());
        }
    }

    // action on match.
    // activate proxify link whenever user right-clicked over hyperlink
    function showProxyMenuItems( p, menuObjects )
    {
        function showLabel(which, menuitem, url, proxy) {
            var p = url;
            var m = url.match(/http[s]?:\/\/([^\/:]+)(:(\d+))?\/(.*)$/);
            if (m) {
                p = m[1];
            }
            p = p.length > 25 ? p.substr ( 0, 25 ) + "..." : p;

            menuitem.setAttribute ("label", libxGetProperty(which, [proxy.name, p]));
        }

        // currently, there's only 1 proxy; but there will be more.
        var proxy = libxProxy;
        for (var i = 0; i < menuObjects.length; i++) {
            var m = menuObjects[i];
            m.setAttribute ( "hidden", false );

            var urltocheck;
            if (p.isOverLink())
                urltocheck = p.getNode().href;
            else
                urltocheck = _content.location.toString();

            if (proxy.canCheck()) {
                showLabel("proxy.checking.label", m, urltocheck, proxy);
                proxy.checkURL(urltocheck, function (ok) {
                    if (ok) {
                        showLabel(p.isOverLink() ? "proxy.follow.label" : "proxy.reload.label", 
                                    m, urltocheck, proxy);
                    } else {
                        showLabel("proxy.denied.label", m, urltocheck, proxy);
                    }
                });
            } else {
                showLabel(p.isOverLink() ? "proxy.follow.label" : "proxy.reload.label", m, urltocheck, proxy);
            }
            m.docommand = function () { doProxify(p, proxy); };
        }
	}
}

// vim: ts=4 sw=4
