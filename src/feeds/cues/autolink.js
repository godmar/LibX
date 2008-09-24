//Define a set of filters and processors for autolinking.  The
//texttransformer.js file contains the definition of the RegExpFilter,
//ISBNRegExpFilter and AnchorNodeProcessor.  The processor function is used in
//creating an instance of AnchorNodeProcessor.  Both the filter and processor
//objects are used in creating an instance of TextTransformer.

//Other types of filters (e. g., StringFilter) and node processors (say one
//that adds a cue to the right of each match) could be created and added to the
//array of objects below

// work-around for non-deterministic cue file execution order
if (undefined == libxEnv.autolink)
    libxEnv.autolink =  { filterProcs: [] };

var autolink = libxEnv.autolink;

(function (filters) {
    for (var i = 0; i < filters.length; i++)
        autolink.filterProcs.push(filters[i]);
})(
      [ 
        //PubMed filter and processor
        { filter : new autolink.regExpFilterClass(/PMID[^\d]*(\d+)/ig),
          processor : function (match, anchor)
                      {
                          if (!libxEnv.openUrlResolver)
                              return null;

                          var pmid = match[1];

                          libxEnv.pubmed.getPubmedMetadataAsText(pmid,
                                  {ifFound: function (text)
                                  {
                                  anchor.title
                                  = libxEnv.getProperty("openurlpmidsearch.label",
                                      [libxEnv.openUrlResolver.name, 
                                      pmid + ": " + text]);
                                  }
                                  });

                          var href = libxEnv.openUrlResolver.makeOpenURLForPMID(pmid);

                          if (null == href)
                              return null;

                          anchor.setAttribute('href', href);

                          return anchor;
                      }
        },
        //DOI filter and processor
        { filter : new autolink.regExpFilterClass(/(10\.\S+\/[^\s,;"'\]\}]+)/ig),
          processor : function (match, anchor)
                      {
                          if (!libxEnv.openUrlResolver)
                          {
                              return null;
                          }

                          var doi = isDOI(match[1]);

                          if (null == doi)
                          {
                              return null;
                          }

                          libxEnv.crossref.getDOIMetadataAsText(doi,
                                  {ifFound: 
                                  function(text)
                                  {
                                  anchor.title
                                  = libxEnv.getProperty("openurldoisearch.label",
                                      [libxEnv.openUrlResolver.name, 
                                      doi + ": " + text]);
                                  }
                                  });

                          var href = libxEnv.openUrlResolver.makeOpenURLForDOI(doi);

                          if (null == href)
                          {
                              libxEnv.writeLog("Got null for href");
                              return null;
                          }

                          anchor.setAttribute('href', href);

                          return anchor;
                      }
        },

        //ISBN filter and processor
        { filter: new autolink.isbnRegExpFilterClass(/((97[89])?((-)?\d(-)?){9}[\dx])(?!\d)/ig),
          processor: function (match, anchor)
                     {
                         var isbn = isISBN(match[1], libraryCatalog.downconvertisbn13);

                         if (null == isbn)
                             return null;

                         this.name = libxEnv.getProperty("isbnsearch.label", [libraryCatalog.name, isbn]);
                         libxEnv.xisbn.getISBNMetadataAsText(isbn,
                                 {ifFound:
                                 function(text)
                                 {
                                 anchor.title 
                                 = "LibX: " 
                                 + libxEnv.getProperty("catsearch.label", 
                                     [libraryCatalog.name, 
                                     text]);
                                 }
                                 });


                         var href = libraryCatalog.linkByISBN(isbn);

                         if (null == href)
                             return null;

                         anchor.setAttribute('href', href);

                         return anchor;
                     }
        },

        //ISSN filter and processor
        { filter: new autolink.regExpFilterClass(/[^0-9](\d{4}-\d{3}[\dx])(?!\d)/ig),
          processor: function (match, anchor)
                     {
                         var issn = isISSN(match[1]);

                         if (null == issn)
                             return null;

                         var split = issn.match(/(\d{4})-(\d{4})/);

                         // suppress what are likely year ranges.
                         if (null != split)
                         {
                             var from = parseInt(split[1]);
                             var to = parseInt(split[2]);

                             if (1000 <= from && 2050 > from && 2200 > to && from < to)
                                 return null;
                         }

                         href = null;

                         if (libxEnv.openUrlResolver && libxEnv.openUrlResolver.autolinkissn)
                         {
                             libxEnv.xisbn.getISSNMetadataAsText(issn,
                                     {ifFound:
                                     function(text)
                                     {
                                     anchor.title 
                                     = "LibX: " 
                                     + libxEnv.getProperty("openurlissnsearch.label", 
                                         [libxEnv.openUrlResolver.name, 
                                         text]);
                                     }
                                     });


                             href = libxEnv.openUrlResolver.makeOpenURLForISSN(issn);


                         }
                         else
                         {
                             libxEnv.xisbn.getISSNMetadataAsText(issn, {ifFound:
                                     function(text)
                                     {
                                     anchor.title
                                     = "LibX: "
                                     + libxEnv.getProperty("issnsearch.label",
                                         [libraryCatalog.name,
                                         text]);
                                     }
                                     });

                             href = libraryCatalog.makeSearch('is', issn);
                         }

                         if (null == href)
                             return null;

                         anchor.setAttribute('href', href);
                         return anchor;
                     }
        }
      ]);


function autolinkFunc (doc, match)
{
    var autolink = libxEnv.autolink;

    var ieRegEx = new RegExp("Microsoft Internet Explorer");

    //Only execute this code if this isn't running under IE
    if (!ieRegEx.test(window.navigator.appName))
    {
        // to work around https://bugzilla.mozilla.org/show_bug.cgi?id=315997
        // we skip autolink if the page contains any textarea element.
        // (though the bug purportedly only affects large textarea elements.)
        var n = libxEnv.xpath.findNodesXML(doc, "//textarea");

        if (0 < n.length)
            return;

    }

    // Prevent execution for builds that lack a buildDate property (before 2008/09/22)
    if (typeof libxEnv.buildDate == "undefined")
    {
        if (libxEnv.options.autolink_active)
            libxRunAutoLink(doc, false);
        return;
    }

    if (libxEnv.getBoolPref('libx.autolink', true ))
    {
        //Define a new TextExplorer object here.  This handles traversing the
        //DOM tree
        var domTraverse = new autolink.textExplorerClass();

        //Create the text transformers using the object array defined above
        for (var ctr = 0; ctr < autolink.filterProcs.length; ++ctr)
        {
            //Create a new AnchorNodeProcessor passing in the process function
            nodeProcessor = new autolink.anchorNodeProcessorClass(autolink.filterProcs[ctr].processor);

            //Create a new TextTransformer
            textTransformer = new autolink.textTransformerClass(autolink.filterProcs[ctr].filter,
                    nodeProcessor);

            //Add the TextTransformer to the TextExplorer
            domTraverse.addTextTransformer(textTransformer);

        }

        //Set the current window and document objects here
        domTraverse.setCurrentWindow(window);
        domTraverse.setCurrentDocument(doc);

        //Start traversing
        domTraverse.traverse(doc.body);

    }
};

//Define a doforurl object
var autolink = new libxEnv.doforurls.DoForURL(/.*/, autolinkFunc, null, "autolink");

// Add Serials Solution page to list of sites where we don't autolink 
if (libxEnv.openUrlResolver && libxEnv.openUrlResolver.type == "sersol") 
{
    autolink.exclude = [libxEnv.openUrlResolver.url.replace("http://", "")];
}

