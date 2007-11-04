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
 *         before it with the same label is not displayed 
 *            ( ie, if ISBN is displayed, then ISSN, PMID, and Title/Author/Keyword 
 *              searches are not checked, however the DOI check is always run )
 *        
 *
 *    Currently the following Context MenuObjects are declared:
 *
 *    DEFAULT:
 *        DOISearch -- Search for DOIs is always done
 *        Proxy     -- Reload/follow link options      
 *
 *    Libx:
 *        1. ISBN/XISBN search
 *        2. ISSN search
 *        3. PMID search
 *        4. Title/Author/Keyword/Scholar search
 *        
 * ************************ Please Note ****************************
 *  The order that menu objects are created affects the order that they appear on the context menu
 *  as well as the order they are evaluated in at this time.
 *        - Currently all menu objects are inserted right before the libx-end holder object, 
 *          which is defined in libx.xul      
 */
function libxInitializeMenuObjects() 
{
    var imgSet = false;
    
    // Use user defined preferences if available
    libxMenuPrefs = new libxXMLPreferences();
    
    // trim a string
    function trim(s) 
    {
        return s.replace(/^\s*/, "").replace(/\s*$/, "");
    }

    function computeDisplayText(text) 
    {
        // XXX handle newlines in the text - they can cause weird symbols
        return text.length > 25 ? text.substr ( 0, 25 ) + "..." : text;
    }
    
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

    
    /*
     * Converts a MenuObject into string
     * used for debugging
     */
    function menuObjectToString( menuobj ) {
        return "source: " + menuobj.source + " name: " + menuobj.name;
    }
    
    function setMenuEntryVisible (menuentry) {
        var mitem = menuentry.menuitem;
        if ( !imgSet ) {
            mitem.setImage();
            imgSet = true;
        }
        mitem.setVisible ( true );
    }

    /*
     * Initializes <catalog>, <openurl>, and <scholar> menu entries
     * <scholar> will call magicsearch
     */
    function initMenuEntry ( menuentry, text ) {
        
        var mitem = menuentry.menuitem;
        var name = menuentry.name;
        setMenuEntryVisible (menuentry);

        menuentry.fields = [{ searchType: menuentry.type, searchTerms: text }];
        switch (menuentry.source) {
        case "catalog":
            menuentry.searcher = libxConfig.catalogs[name];
            break;
        case "openurl":
            menuentry.searcher = libxConfig.resolvers[name];
            break;
        case "scholar":
            text = trim(text);
            mitem.setHandler ( function (menuentry) { magicSearch (text); } );
            mitem.setLabel ( libxEnv.getProperty("contextmenu.scholarsearch.label", [computeDisplayText(text)] ) );
            return;
        default:
            libxEnv.writeLog ( "Unknown menuentry.source: " + menuentry.source );
            return;
        }

        var displayText = computeDisplayText(text);
        mitem.setLabel ("Search " + name + " for " 
                        + libxConfig.searchOptions[menuentry.type] 
                        + " \"" + displayText + "\"" );
        mitem.setHandler ( function (menuentry) {
                              menuentry.searcher.search ( menuentry.fields ); 
                          } );

        if (menuentry.searcher == null || menuentry.searcher == "") {
            libxEnv.writeLog ( "Error initializing menuitem: { " + menuObjectToString( menuentry ) + " }" );
            menuentry.menuitem.setVisible(false);
        }
    }

    /*********************** ISBN/XISBN options *****************************************/
                  
    libxRegisterContextMenuObject ( 
        "libx", "isbn",
        function (p) {
            if (p.isTextSelected()) 
                return isISBN(p.getSelection()); 
            else 
                return null; 
        },
        isbnMatch );

    /*
     * Function called if a ISBN is selected
     * Supports catalog and openurl sources
     * Searching is done via .search using 'i' as searchtype, unless
     * searchtype is xisbn, where makeXISBNRequest is called
     */
    function isbnMatch ( pureISN, menuEntries ) {
    
        for ( var i = 0; i < menuEntries.length; i++ ) {
            var mitem = menuEntries[i].menuitem;
            
            var name = menuEntries[i].name;
            initMenuEntry ( menuEntries[i], pureISN );
            
            // xisbn requires special case
            // will overwrite values as needed from after initMenuEntry is run
            if ( menuEntries[i].type == "xisbn" ) {
                menuEntries[i].searcher = libxConfig.catalogs[name];
                mitem.setLabel (libxEnv.getProperty("xisbnsearch.label", [name, pureISN]) );
                mitem.setHandler ( function (menuentry) {
                    libxEnv.openSearchWindow(menuentry.searcher.makeXISBNRequest( pureISN  )); 
                });
            }
        }    
    }
    
    /*********************************** ISSN options *******************************************/
    
    libxRegisterContextMenuObject (
        "libx", "issn",
        function (p) { 
            if (p.isTextSelected()) 
                return isISSN(p.getSelection()); 
            else 
                return null; 
        },
        issnMatch );
    
    /*
     * Function called if an ISSN is selected
     * Supports <catalog> and <openurl>
     * Searches via .search using searchtype 'i'
     */
    function issnMatch ( pureISN, menuEntries ) {
        for ( var i = 0; i < menuEntries.length; i++ ) {
            initMenuEntry ( menuEntries[i], pureISN );
        }
    }
    
    /********************************* PMID Options **********************************************/
    
    libxRegisterContextMenuObject (
        "libx", "pmid",
        function (p) { 
            if (p.isTextSelected()) 
                return isPMID(p.getSelection()); 
            else 
                return null; 
        },
        pmidMatch );
    
    function pmidMatch ( pmid, menuEntries ) {
        for ( var i = 0; i < menuEntries.length; i++ ) {
            initMenuEntry ( menuEntries[i], pmid );
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
    
    /*********************************** DOI options ( always checked ) *******************************************/

    libxRegisterContextMenuObject ( "libx", "doi", isDOIF, doiMatch );
    
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
    function doiMatch ( doi, menuEntries ) {
        for ( var i = 0; i < menuEntries.length; i++ ) {
            initMenuEntry ( menuEntries[i], doi );
        }
    }     
    
    /*********************************** Author/Title/Keyword search *******************************************/


    libxRegisterContextMenuObject ( "libx", "general", isTextSelected, defaultMatch );

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


    /*
     * Default action that is called if no ISBN/ISSN/PMID was recognized
     * Defers to initMenuEntry
     */
    function defaultMatch ( sterm, menuEntries ) 
    {
        sterm = trim(sterm);

        for ( var i = 0; i < menuEntries.length; i++ ) {
            var sterm1 = sterm;
            
            // create local copy to avoid overwriting sterm when author heuristics is applied
            if ( menuEntries[i].type == 'a' )   // Transform author
                sterm1 = trim(transformAuthorHeuristics(sterm));

            initMenuEntry ( menuEntries[i], sterm1 );
        }
    }

    /********************************* Proxy Options **********************************************/

    
    libxRegisterContextMenuObject ( "always", "proxy", isProxyActive, showProxyMenuItems );
    
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
            var _location = libxEnv.getCurrentWindowContent().location.toString();
            libxEnv.openSearchWindow(proxy.rewriteURL(_location), true, "libx.sametab");
        }
    }

    // action on match.
    // activate proxify link whenever user right-clicked over hyperlink
    function showProxyMenuItems( p, menuEntries )
    {
          function showLabel(which, menuitem, url, proxy) {
            var p = url;
            var m = url.match(/http[s]?:\/\/([^\/:]+)(:(\d+))?\/(.*)$/);
            if (m) {
                p = m[1];
            }
            menuitem.setLabel ( libxEnv.getProperty(which, [proxy.name, computeDisplayText(p)]));            
        }
        
        for (var i = 0; i < menuEntries.length; i++) {
            var name = menuEntries[i].name;
            var m = menuEntries[i].menuitem;
            var proxy = libxConfig.proxy[name];
            
            setMenuEntryVisible ( menuEntries[i] );
            m.setVisible (true);
            
            var urltocheck;
            if (p.isOverLink())
                urltocheck = p.getNode().href;
            else
                urltocheck = libxEnv.getCurrentWindowContent().location.toString();

            if (proxy.canCheck() && libxEnv.getBoolPref ( 'libx.proxy.ajaxlabel', true ) ) {
                showLabel("proxy.checking.label", m, urltocheck, proxy);
                proxy.checkURL(urltocheck, function (ok) {
                    if (ok) {
                        showLabel(p.isOverLink() ? "proxy.follow.label" : "proxy.reload.label", 
                                    m, urltocheck, proxy);
                    } else {
                        showLabel("proxy.denied.label", m, urltocheck, proxy);
                    }
                    if (proxy.disableIfCheckFails()) {
                        m.setActive(ok);
                    }
                });
            } else {
                showLabel(p.isOverLink() ? "proxy.follow.label" : "proxy.reload.label", m, urltocheck, proxy);
            }
            m.setHandler ( function () { doProxify(p, proxy); } );
        }
    }
}

// vim: ts=4 sw=4
