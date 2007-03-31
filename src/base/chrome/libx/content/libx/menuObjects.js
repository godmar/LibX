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
function initializeMenuObjects() 
{
    // trim a string
    function trim(s) 
    {
        return s.replace(/^\s*/, "").replace(/\s*$/, "");
    }

	function setHidden(objectId, menObject)
	{
		menObject.setAttribute ( "hidden", false );	
	}
	
	/********************** Initilizes the Default label ********************************/
	LibxLabels.push ( "DEFAULT" );
	LibxMenuItems["DEFAULT"] = new Array();
	/*********************** Do Not Remove/Modify ***************************************/
	
	
	/*********************** ISBN/XISBN options *****************************************/
	
	LibxContextMenuObject ( [ { id:"libx-isbn-search", hidden:"true", oncommand:"doSearchBy('i');" },
				 { id:"libx-xisbn-search", hidden:"true" } ], 
				 "libx",
				 function(p) { if (p.isTextSelected()) return isISBN(p.getSelection()); else return null; },
				  ISBNAction );	

	function ISBNAction ( s, menuObjects ) {
		pureISN = s;
		menuObjects[0].setAttribute ( "label", libxGetProperty("isbnsearch.label", [libraryCatalog.name, pureISN]) );
		menuObjects[1].setAttribute ( "label", libxGetProperty("xisbnsearch.label", [pureISN]) );
		menuObjects[0].setAttribute ( "hidden", false );
		if (libraryCatalog.xisbn.opacid) {   // only true if xISBN is supported for this catalog
		    menuObjects[1].setAttribute ( "hidden", false );
		    menuObjects[1].setAttribute ( "oncommand", 
		    	"libxEnv.openSearchWindow(libraryCatalog.makeXISBNRequest(\"" + s + "\"))" );
		}
	}
	
	
	/*********************************** ISSN options *******************************************/
	var openurlissnsearch = [{ id:"libx-issn-search", hidden:"true", oncommand:"doSearchBy('i');" },
	           {id:"libx-openurl-issn-search", hidden:"true" }];
	
	LibxContextMenuObject ( openurlissnsearch, "libx",
			function(p) { if (p.isTextSelected()) return isISSN(p.getSelection()); else return null; },
			 ISSNAction );
	
	function ISSNAction ( s, menuObjects ) {
		pureISN = s;
		var isbnsearch = menuObjects[0];
		isbnsearch.setAttribute ( "label", libxGetProperty("issnsearch.label", [libraryCatalog.name, pureISN]) );
		isbnsearch.setAttribute ( "hidden", false );
		if (libxEnv.openUrlResolver) {
		    menuObjects[1].setAttribute ( "hidden", false );
		    menuObjects[1].setAttribute ( "label", libxGetProperty("openurlissnsearch.label", [libxEnv.openUrlResolver.name, pureISN] ) );
		    menuObjects[1].setAttribute ( "oncommand",
			"libxEnv.openSearchWindow(libxEnv.openUrlResolver.makeOpenURLForISSN(\"" + s + "\"));" );
		    
		}		
	}
	
	/********************************* PMID Options **********************************************/
	var pmidsearch = [{id:"libx-pmid-search", hidden:"true" }];
	
	LibxContextMenuObject ( pmidsearch, "libx",
		function(p) { if (p.isTextSelected()) return isPMID(p.getSelection()); else return null; },
		PMIDAction );
	
	function PMIDAction ( s, menuObjects ) {
		if (libxEnv.openUrlResolver) {
			menuObjects[0].setAttribute ( "label", libxGetProperty("openurlpmidsearch.label", [libxEnv.openUrlResolver.name, s]) );
			menuObjects[0].setAttribute ( "hidden", false );
			menuObjects[0].setAttribute ( "oncommand", 
			"libxEnv.openSearchWindow(libxEnv.openUrlResolver.makeOpenURLForPMID(\"" + s + "\"));");
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
	
	var libxMenuItems = [{id:"libx-keyword-search", label:"", oncommand:"doSearchBy('Y');"},
	 {id:"libx-title-search", label:"", oncommand:"doSearchBy('t');" },
	 {id:"libx-author-search", label:"", oncommand:"doSearchBy('a');" },
	 {id:"libx-magic-search", hidden:"true" }];
	 	
	LibxContextMenuObject ( libxMenuItems, "libx", def, DEFAULTAction );
	
	function def ( s ) {
        var m;
		if ( m = s.getSelection() )
		  return m;
		return null;
	}
	
	// don't show keyword, title, author if ISSN/ISBN or PMID was recognized
	function DEFAULTAction ( p, menuObjects ) 
	{
		p = trim(p);
        var displayText = p.length > 25 ? p.substr ( 0, 25 ) + "..." : p;
		
		menuObjects[0].setAttribute ( "label", libxGetProperty("contextmenu.keywordsearch.label", [libraryCatalog.name, displayText]) );
		setHidden("libx-keyword-search", menuObjects[0]);

        menuObjects[1].setAttribute ( "label", libxGetProperty("contextmenu.titlesearch.label", [libraryCatalog.name, displayText]) );
        setHidden("libx-title-search", menuObjects[1]);

        menuObjects[2].setAttribute ( "label", libxGetProperty("contextmenu.authorsearch.label", [libraryCatalog.name, displayText]) );
        setHidden("libx-author-search", menuObjects[2]);
        
        menuObjects[3].setAttribute ( "hidden", false );
        
		menuObjects[3].setAttribute ( "label", libxGetProperty("contextmenu.scholarsearch.label", [displayText] ) );
        /* Use a closure here to avoid having to quote 'p' */
        menuObjects[3]._magicsearch = function () { magicSearch(p); }
        menuObjects[3].setAttribute ( "oncommand", "this._magicsearch();" );
    }
    
    /*********************************** DOI options ( always checked ) *******************************************/
	//var doisearch = [{id:"libx-doi-search", hidden:"true", oncommand:"doDoiSearch();"}];
	var doisearch = [{id:"libx-doi-search", hidden:"true"}];
	LibxContextMenuObject ( doisearch, "DEFAULT", isDOIF, DOIAction );
	
	function isDOIF ( p ) {
		if (p.isOverLink()) {
			return isDOI(decodeURI(p.getNode().href));//does href of hyperlink over which user right-clicked contain a doi?
		}
		else if ( p.isTextSelected() ) {
			return isDOI ( p.getSelection() );
		}		
	}
	
	// DOI displays in addition to keyword, title, author
	function DOIAction ( s, menuObjects ) {
		if (s != null && libxEnv.openUrlResolver) {
			menuObjects[0].setAttribute ( "label", libxGetProperty("openurldoisearch.label", [libxEnv.openUrlResolver.name, s]) );
			menuObjects[0].setAttribute ( "hidden", false );
			menuObjects[0].setAttribute ( "oncommand", 
			"libxEnv.openSearchWindow(libxEnv.openUrlResolver.makeOpenURLForDOI(\"" + s + "\"));");
		}
	}	
	
	/********************************* Proxy Options **********************************************/
	var libxProxyObj = [{id:"libx-proxify"}];
	
	LibxContextMenuObject ( libxProxyObj, "Libx-Proxy", 
						isProxyActive, showProxyMenuItems );
	
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
            // XXX this may be incorrect for multiple proxies; I'm not sure if
            // 'proxy' is captured in this closure or not.  Read up in JavaScript spec.
            m.proxify = function () { doProxify(p, proxy); }
            m.setAttribute ( "oncommand", "this.proxify();" );
        }
	}
}

// vim: ts=4

