
/**
 * Creates an object for retrieving a libxess search feed
 */
libxEnv.libxess = function ( query, type, searchtype, catalogurl )
{
    // This constructs the query string for the libxess php scripts
    // This is currently specific to addison.vt.edu since there are different 
    // rest query formats for the iii's
	var queryString =
        "http://top.cs.vt.edu/~doylem/libxess/libxess2.php?type=innopac&target=http://addison.vt.edu&query=" 
        + query + "&format=DC";

    var xml;
    
    // Gets the libxess xml as text ( cant get xml bc sandbox )
    this.get = function( callback )
    {
        xml = libxEnv.getDocument( queryString, callback );
    }


    // returns the xml ( need to call get first )
    this.getDocument = function()
    {
        return xml;
    }
}

/**
 * Utility functions for extracting data from the libxess feeds
 * Initalize with the text representation of the xml feed.
 */
libxessUtils = function()
{
    var docText;
    var doc;
    var feed;
    var dlf;
    var iso;
    var dc_parent;
    var marc;
    var contentXML;

    // loads a document object from text representation of one
    this.loadDocumentFromText = function( text )
    {
        docText = text;
        // FF Specific needs to be both
        doc = (new DOMParser()).parseFromString(text, "text/xml");
    }

    // Loads a document from a document object
    this.loadDocument = function( document )
    {
        doc = document;
    }
    

    // gets an array of the entries of the atom feed
    this.getAtomEntries= function()
    {
        var entries = $('entry',doc);
        return entries;
    }

    // gets the content of the given atom entry
    this.getAtomEntryContent = function( entry )
    {
        return entry.find("content",doc).contents();
    }
    
    // gets the title of the given atom entry
    this.getAtomEntryTitle = function( entry )
    {
        return entry.find("title",doc).text();
    }

    // gets the summary of the given atom entry
    this.getAtomEntrySummary = function( entry )
    {
        return entry.find("summary",doc).text();
    }
    
    // gets the title of the atom feed
    this.getAtomTitle = function()
    {
        return $('feed',doc).children('title');
    }
   
    /// OPEN SEARCH FUNCTIONS
    
    // gets the number of results found by libxess
    this.getOpenSearchTotalResults = function ()
    {
        return $('opensearch\\:totalResults', doc ).text();
    }


    // Gets the dlf from the entries content tag
    // And selects it ( matters for following functions )
    this.getDLFforEntry = function ( entry )
    {
        dlf = $('content', entry ).contents();
        return dlf;
    }
   
    // gets the id of the dlf record
    this.getDLFID = function ()
    {
        var biblio = dlf.find('dlf\\:bibliographic');
        var id = biblio.attr( 'id' );
        return id;
    } 
    
   
    this.getDLF = function()
    {
        dlf = $('content', doc).contents();
        return dlf;
    }

    /**
     * ISO FUNCTIONS 
     */

    // gets the iso for the currently selected dlf
    // and selects that iso
    this.getISO = function()
    {
        iso = dlf.find('iso\\:holdings');
        return iso;
    }

    // Returns the availability in an array from the currently selecter iso
    this.getAvailability = function()
    {
        var copyInfos = $(iso).find('iso\\:copyInformation');
        var availability = new Array();
        copyInfos.each( function () { 
            var item = new Object();
            item.location = $(this).children('iso\\:sublocation').text();
            item.callNum = $(this).find('iso\\:pieceIdentifier iso\\:value').text();
            item.status = $(this).find('iso\\:availabilityStatus').text();
            item.msg = $(this).children('iso\\:note').text();
            item.toString = function ()
            {
                return item.location + "   /    " + item.callNum + 
                    "   /   " + item.status;
            }
            availability.push( item );
        } );
        return availability;
    }


    /**
     *  MARC FUNCTIONS 
     */

    // retrieves the marc record from the currently selected dlf
    // and selects that marc record
    this.getMarc = function()
    {
        marc = dlf.find('marc\\:record');
        return marc;
    }
     
    // Gets the long title from the currently selected marc record
    this.getMarcTitleLong = function()
    {
        var field = marc.find("marc\\:datafield[tag=245]" );
        var title = field.children("[code=a]").text();
        title += " " + field.children("[code=b]").text();
        title += " " + field.children("[code=c]").text();
        return title;
    }
    
    // gets the short title from the currently selected marc record
    this.getMarcTitle = function()
    {
        var field = marc.find("marc\\:datafield[tag=245]" );
        var title = field.children("[code=a]").text();
        return title;
    }
    
    // gets the author from the currently selected marc record
    this.getMarcAuthor = function()
    {
        var field = marc.find("marc\\:datafield[tag=100]" );
        var author = field.children("[code=a]").text();
        return author;
    }

    /**
     * DC Functions
     */
    
    // selects the parent of the dc record inside the currently selected dlf
    this.getDC = function()
    {
        dcParent = dlf.find('dlf:bibliographic');
        return dcParent;
    }
    
    // returns the title from the current dc
    this.getDCTitle = function ()
    {
        var field = dlf.find("dc\\:title");
        return field.text();
    }
   

    // returns the source from the current dc
    this.getDCSource = function ()
    {
        var field = dlf.find("dc\\:source");
        return field.text();
    }

    // returns the format from the current dc
    this.getDCFormat = function ()
    {
        var field = dcParent.find("dc\\:format");
        return field.text();
    } 

}

libxEnv.libxessUtils = new libxessUtils();
