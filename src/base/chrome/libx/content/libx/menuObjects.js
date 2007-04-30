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

    libxMenuPrefs = new LibxXMLPreferences ( "chrome://libx/content/defaultprefs.xml" );
    
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

    
    /*
     * Converts a MenuObject into string
     * used for debugging
     */
    function menuObjectToString( menuobj ) {
        return "source: " + menuobj.source + " name: " + menuobj.name;
    }
    
    /*
     * Initializes <catalog> and <openurl> menuobjects
     */
    function initMenuObject ( obj, text ) {
        
        var mitem = obj.menuitem;
        var name = obj.name;
        mitem.fields = [{ searchType: obj.type, searchTerms: text }];
        if ( obj.source == "catalog" ) {
            mitem.searcher = libxConfig.catalogs[name];    
        }   
        else if ( obj.source == "openurl" ) {
            mitem.searcher = libxConfig.resolvers[name];
        }         
        if ( mitem.searcher ) {
            libxEnv.setObjectVisible(mitem, true);
            mitem.setAttribute ( "label",
                "Search " + name + " for " + libxConfig.searchOptions[obj.type] + " \"" + text + "\"" );
            mitem.docommand = function () {
                                  this.searcher.search ( this.fields ); 
                              };
        }
        else {
            libxEnv.writeLog ( "Error initializing menuitem: { " + menuObjectToString( obj ) + " }" );
        }
    }

    /*********************** ISBN/XISBN options *****************************************/
                  
    LibxContextMenuObject ( "isbn", 
                            "libx",
                            function(p) { 
                                if (p.isTextSelected()) 
                                    return isISBN(p.getSelection()); 
                                else 
                                    return null; 
                            },
                            ISBNAction );

    /*
     * Function called if a ISBN is selected
     * Supports catalog and openurl sources
     * Searching is done via .search using 'i' as searchtype, unless
     * searchtype is xisbn, where makeXISBNRequest is called
     */
    function ISBNAction ( pureISN, menuObjects ) {
    
        for ( var i = 0; i < menuObjects.length; i++ ) {
            var mitem = menuObjects[i].menuitem;
            
            var name = menuObjects[i].name;
            initMenuObject ( menuObjects[i], pureISN );
            
            // xisbn requires special case
            // will overwrite values as needed from after initMenuObject is run
            if ( menuObjects[i].type == "xisbn" ) {
                mitem.searcher = libxConfig.catalogs[name];
                mitem.setAttribute ( "label", 
                    libxGetProperty("xisbnsearch.label", [pureISN]) );
                mitem.docommand = function () {
                        libxEnv.openSearchWindow( 
                            this.searcher.makeXISBNRequest( pureISN  )); 
                    };
            }              
                   
        }    
    }
    
    /*********************************** ISSN options *******************************************/
    
    LibxContextMenuObject ( "issn", 
                            "libx",
                            function(p) { 
                                if (p.isTextSelected()) 
                                    return isISSN(p.getSelection()); 
                                else 
                                    return null; 
                            },
                            ISSNAction );
    
    /*
     * Function called if an ISSN is selected
     * Supports <catalog> and <openurl>
     * Searches via .search using searchtype 'i'
     */
    function ISSNAction ( pureISN, menuObjects ) {
    
        for ( var i = 0; i < menuObjects.length; i++ ) {
            initMenuObject ( menuObjects[i], pureISN );
        }
    }
    
    /********************************* PMID Options **********************************************/
    
    LibxContextMenuObject ( "pmid", "libx",
        function(p) { 
            if (p.isTextSelected()) 
                return isPMID(p.getSelection()); 
            else 
                return null; 
        },
        PMIDAction );
    
    function PMIDAction ( pmid, menuObjects ) {
        for ( var i = 0; i < menuObjects.length; i++ ) {
            initMenuObject ( menuObjects[i], pmid );
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

         
    LibxContextMenuObject ( "general", "libx", isTextSelected, DEFAULTAction );
    
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
     * Supports <catalog>, <openurl>, and <scholar> tags
     * <scholar> will call magicsearch
     */
    function DEFAULTAction ( p, menuObjects ) 
    {
        p = trim(p);
        var displayText = p.length > 25 ? p.substr ( 0, 25 ) + "..." : p;

        for ( var i = 0; i < menuObjects.length; i++ ) {

            initMenuObject ( menuObjects[i], displayText );
            
            var mitem = menuObjects[i].menuitem;

            if ( menuObjects[i].source ==  "scholar" ) {
                    mitem.docommand = function () { magicSearch (p); };
                    mitem.setAttribute ( "label", libxGetProperty("contextmenu.scholarsearch.label", [displayText] ) );
                    libxEnv.setObjectVisible(mitem, true);
            }    
        }    
    }
    
    /*********************************** DOI options ( always checked ) *******************************************/

    LibxContextMenuObject ( "doi", "DEFAULT", isDOIF, DOIAction );
    
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
    
        for ( var i = 0; i < menuObjects.length; i++ ) {
            initMenuObject ( menuObjects[i], doi );
        }
    }    
    
    /********************************* Proxy Options **********************************************/

    
    LibxContextMenuObject ( "proxy", "DEFAULT", isProxyActive, showProxyMenuItems );
    
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
            var m = menuObjects[i].menuitem;
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
