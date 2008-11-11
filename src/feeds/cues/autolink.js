//Define a set of filters and processors for autolinking.  The
//texttransformer.js file contains the definition of the RegExpFilter,
//ISBNRegExpFilter and AnchorNodeProcessor.  The processor function is used in
//creating an instance of AnchorNodeProcessor.  Both the filter and processor
//objects are used in creating an instance of TextTransformer.

//Other types of filters (e. g., StringFilter) and node processors (say one
//that adds a cue to the right of each match) could be created and added to the
//array of objects below

var autolink = libxEnv.autolink;

(function (filterProcs) 
    {
        //Create the text transformers using the object array defined above
        for (var ctr = 0; ctr < filterProcs.length; ++ctr)
        {
            //Create a new AnchorNodeProcessor passing in the process function
            var nodeProcessor = new autolink.anchorNodeProcessorClass(filterProcs[ctr].processor);

            //Create a new TextTransformer
            var textTransformer = new autolink.textTransformerClass(
                {
                    filter: filterProcs[ctr].filter,
                    processor: nodeProcessor
                });

            autolink.textTransformers.push(textTransformer);
        }
    })(
      [ 
        //PubMed filter and processor
        { filter : new autolink.regExpFilterClass(/PMID[^\d]*(\d+)/ig),
          processor : function (match, anchor)
                      {
                          if (!libxEnv.openUrlResolver)
                          {
                              return null;
                          }

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

                          if (href === null)
                          {
                              return null;
                          }

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

                          if (doi === null)
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

                          if (href === null)
                          {
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
                         var isbn = isISBN(match[1], libx.edition.catalogs.default.downconvertisbn13);

                         if (isbn === null)
                         {
                             return null;
                         }

                         this.name = libxEnv.getProperty("isbnsearch.label", [libx.edition.catalogs.default.name, isbn]);
                         libxEnv.xisbn.getISBNMetadataAsText(isbn,
                                 {ifFound:
                                 function(text)
                                 {
                                 anchor.title 
                                 = "LibX: " 
                                 + libxEnv.getProperty("catsearch.label", 
                                     [libx.edition.catalogs.default.name, 
                                     text]);
                                 }
                                 });


                         var href = libx.edition.catalogs.default.linkByISBN(isbn);

                         if (href === null)
                         {
                             return null;
                         }

                         anchor.setAttribute('href', href);

                         return anchor;
                     }
        },

        //ISSN filter and processor
        { filter: new autolink.regExpFilterClass(/[^0-9](\d{4}-\d{3}[\dx])(?!\d)/ig),
          processor: function (match, anchor)
                     {
                         var issn = isISSN(match[1]);

                         if (issn === null)
                         {
                             return null;
                         }

                         var split = issn.match(/(\d{4})-(\d{4})/);

                         // suppress what are likely year ranges.
                         if (split !== null)
                         {
                             var from = parseInt(split[1], 10);
                             var to = parseInt(split[2], 10);

                             if (1000 <= from && 2050 > from && 2200 > to && from < to)
                             {
                                 return null;
                             }
                         }

                         var href = null;

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
                                         [libx.edition.catalogs.default.name,
                                         text]);
                                     }
                                     });

                             href = libx.edition.catalogs.default.makeSearch('is', issn);
                         }

                         if (href === null)
                         {
                             return null;
                         }

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
    if (!ieRegEx.test(window.navigator.appName)
        && !window.navigator.userAgent.match(/.*Firefox\/3/))
    {
        // to work around https://bugzilla.mozilla.org/show_bug.cgi?id=315997
        // we skip autolink if the page contains any textarea element.
        // (though the bug purportedly only affects large textarea elements.)
        // Should no longer be needed in Firefox 3
        var n = libxEnv.xpath.findNodesXML(doc, "//textarea");

        if (n.length > 0)
        {
            return;
        }

    }


    // Prevent execution for builds that lack a buildDate property (before 2008/09/22)
    if (typeof libxEnv.buildDate === "undefined")
    {
        if (libxEnv.options.autolink_active)
        {
            libxRunAutoLink(doc, false);
        }
        return;
    }


    if (libxEnv.getBoolPref('libx.autolink', true ))
    {
        //Define a new TextExplorer object here.  This handles traversing the
        //DOM tree
        var domTraverse = new autolink.textExplorerClass();

        // install registered text transformers
        for (var i = 0; i < autolink.textTransformers.length; i++) 
        {
            domTraverse.addTextTransformer(autolink.textTransformers[i]);
        }

        //Set the current window object here
        domTraverse.setCurrentWindow(window);

        //Start traversing
        domTraverse.traverse(doc.body);
    }
}

//Define a doforurl object
var autolinkDoForURL = new libxEnv.doforurls.DoForURL(/.*/, autolinkFunc, null, "autolink");

// Add Serials Solution page to list of sites where we don't autolink 
if (libxEnv.openUrlResolver && libxEnv.openUrlResolver.type == "sersol") 
{
    autolinkDoForURL.exclude = [libxEnv.openUrlResolver.url.replace("http://", "")];
}



