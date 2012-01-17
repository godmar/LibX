<?
include ('readconfigxml.php');

$subscribedpkgs = $config->xpath('/edition/localizationfeeds/feed[@type="package"]');

?>

<html>
  <head>
    <link href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/jquery-ui.css" rel="stylesheet" type="text/css"/>
    <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.5/jquery.min.js"></script>
    <script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/jquery-ui.min.js"></script>

    <link rel="stylesheet" type="text/css" href="downloadlibx2.css">
    <link rel="icon" href="<? echo $icon ?>" type="image/x-icon" />
    <link rel="shortcut icon" href="<? echo $icon ?>" type="image/x-icon" />
    <base target="_top" />
        
    <!-- This meta tag is used for edition autosensing.
         The name attribute MUST be "libxeditioninfo".
         The content attribute must use the following format: "<id>;<version>[;<name>]"
         where <id> is the edition's idenitifer (e.g., vt)
         <version> is the edition version (e.g., 1.5.17)
         <name> is the edition name (e.g., Virginia Tech Edition)
         <name> is optional; if not supplied, name will be retrieved from LibX server
         Examples of valid meta tags:
         <meta name="libxeditioninfo" content="vt.16;1.5.16" />
         <meta name="libxeditioninfo" content="vt;1.5.17;Virginia Tech Edition" />
    -->
    <meta name="libxeditioninfo" content="<? echo $edition . 
            ($revision != "" ? "." . $revision : "") . ";" . $version ?>" />
    <title>LibX <? echo $edition_name ?></title>
    
    <script>
      $(document).ready(function() {
          $("#demo-button").button().click( function () {
                $("#demo-iframe").fadeIn(2000);
                $(".demo-iframe-close").fadeIn(2000);
          });
       });

      function toggletopnav(item) {
        $("#demo-iframe").hide();
        $(".demo-iframe-close").hide();
        $anchorItem = $(item);
        $li_parent = $anchorItem.parent();
        // for each li elem in ul add anchor element
        if($li_parent.index() == 0/*demo tab*/) { 
           $(".displaypackages").show();
        } else {/*for any other tab click hide subscribed packages section*/ 
           $(".displaypackages").hide();
        }
        $li_parent.siblings().each(function () {
           if ($(this).index() == 3) return;//index 3 corresponds to faq tab..since it open a different page. Do nothing
           var itemName = $(this).text();$(this).text("");
           $(this).append('<a onclick="toggletopnav(this)" href="#">'+itemName+'</a>');
           $('.'+itemName.toLowerCase()).hide();
        });
        var name = $anchorItem.remove().text();
        $li_parent.text(name);
        $('.'+name.toLowerCase()).show();
      }

      function hideDemoIframe() {
         $(".demo-iframe-close").fadeOut();
         $("#demo-iframe").fadeOut();
      }
    </script>

  </head>
  <body>
    <div id="c-doc">
      <div id="c-header">
        <img class="logo" src="<? echo $icon ?>" alt="<? echo $edition_name ?>"> 
        <ul id="c-nav">
          <li>Demo</li>
	  <li><a onclick="toggletopnav(this)" href="#" >Features</a></li>
          <li><a onclick="toggletopnav(this)" href="#" >Privacy</a></li>
          <li><a href="http://libx.org/faq.html">FAQs</a></li>
        </ul>   
      </div>
      <div id="c-main">
        <div id="main-content">
          <ul id="download-buttons">
            <li>
              <a id="ff-button" href="<? echo $ff_extpath ?><? echo $edition ?>">Install Extension for Firefox</a>
            </li>
            <li>
              <a id="gc-button" href="<? echo $gc_extpath ?><? echo $edition ?>">Install Extension for Google Chrome</a>
            </li>
          </ul>
        </div>
      </div>
      <div id="intro">
        <h1 class="title">LibX <? echo $edition_name ?></h1>
        <span>Revision <? echo $version ?></span></br></br>
        <span class="demo">
          <a id="demo-button" href="#" class="button">Demo LibX 2.0</a>
        </span>
        <div>
           <div class="demo-iframe-close" onclick="hideDemoIframe()"/>Close[X]</div>
           <div id="demo-iframe" class="ui-widget-content ui-corner-all">
             <iframe frameborder="0" scrolling="no" width="640" height="300" src="<? echo $libx2base ?>/src/base/popup/popup.html#edition=<? echo $edition .
             ($revision != '' ? '.' . $revision : '')?>"></iframe>
           </div>
        </div>
        <div class="displaypackages">
          <h2>Subscribed Packages</h2>
          <ul id="subscribedpkgs">
            <? foreach($subscribedpkgs as $pkg) { ?>
               <h2><? $haspkg = true; ?></h2>
               <li class="pkgs">
                 <a href="<? echo $libx2base ?>/src/libappdisplay/index.php?pkg=<? echo $pkg['url'] ?>" ><? echo $pkg['description'] ?></a>
               </li>
             <? } ?>
          </ul>
           <? if(! $haspkg ) { ?>
               <h3>None</h3>
           <? } ?>
        </div>
      </div>
      <div id="libxfeatures" class="features">
        <h2>Libx Features</h2>
        <p class="features-intro">LibX <?echo $edition_name ?> browser extensions provides direct access to your Library's resources</p>
        <ul class="libxfeatures-list">
          <li>
            <span class="feat-img-set">
              <img src="images/right_click_transparent2.jpg" alt="Context Menu" class="f1-right-click-img"/>
              <img src="<? echo $icon; ?>" class="f1-icon"/>
            </span>
            <h2>Toolbar &amp; Right-Click Context Menu</h2>
            <p>Search your library catalog directly from the LibX toolbar or using the right-click context menu</p>
          </li>
          <li>
            <span class="feat-img-set">
              <img src="oca.gif" alt="Off Campus Access" class="f2-oca-img"/>
            </span>
            <h2>Support for off-campus access via EZProzy/WAM</h2>
            <p>Using the Library's off-campus proxy, you may reload a page through the proxy, or follow a link via the proxy, making it appear as though you are coming from an on-campus computer</p>
          </li>
          <li>
            <span class="feat-img-set">
              <img src="fulltext.gif" alt="Full Text" class="f3-ft-img"/>
            </span>
            <h2>Quick full text access to journal articles</h2>
            <p>LibX uses Google Scholar to search for articles and directs the user to the electronic copy subscribed to by your Library. Select  a citation, then drag-and-drop it onto the Scholar button on the toolbar. You can use this feature even from inside a PDF file, which makes retrieving papers referenced in a PDF file a snap.
             To use this feature, your library must be a Google Scholar library, or you
must activate this link in the Firefox profile in which LibX is installed: <a href="http://scholar.google.com/scholar_setprefs?num=10&amp;instq=&amp;inst=sfx-f7e167eec5dde9063b5a8770ec3aaba7&amp;q=einstein&amp;inststart=0&amp;submit=Save+Preferences">
Activate Google Scholar support.</a> (See also <a href="http://libx.org/faq.html#QL9">LibX FAQ Question 11</a>)
            </p>
         </li>
          <li>
            <span class="feat-img-set">
              <img src="images/cue_amazon1.jpg" alt="Amazon Cue" class="f4-amazon-cue-img"/>
              <img src="<? echo $cueicon; ?>" class="f4-icon"/>
            </span>
            <h2>Support for embedded cues</h2>
            <p>LibX places cues 
              <a title="Search <? echo $primary_catalog_name; ?> for ISBN 0684824906" href="http://addison.vt.edu/search/?searchtype=i&amp;searcharg=0684824906&amp;startLimit=&amp;searchscope=1&amp;SORT=R&amp;endLimit=&amp;sid=libxvt">
                <img style="height:16px" src="<? echo $cueicon; ?>" border="0">
              </a>
              in web pages you visit if your library has resources related to that page.  Whenever you see the cue,click on the link to look at what the Library has to offer.
For instance, book pages at Amazon or Barnes &amp; Noble will contain cues 
that link to the book's entry in <? echo $primary_catalog_name; ?>.
Cues are displayed at Google, Yahoo! Search, the NY Times Book Review, and other pages.
Watch <a target="_top" href="http://libx.org/screencasts/demo3.htm">this screencast for examples of this cool feature.</a> (requires Macromedia Flash Plugin)
           </p>
         </li>
         <li>
           <span class="feat-img-set">
             <img src="isbn.png" alt="ISBN Barcode" class="f5-isbn-img"/>  
            </span>
            <h2>Support for xISBN</h2>
            <p>
              A book title can have different ISBNs for the paperback, the hardcover, even for different editions.LibX supports OCLC's <a target="_top" href="http://www.oclc.org/research/researchworks/xisbn/default.htm">xISBN service:</a>you can find a book, given an ISBN, even if the library holds this book under a different ISBN
            </p>
         </li>
        </ul>
      </div>
      <div id="userprivacy" class="privacy">
        <h2>Privacy Policy</h2>
        <p>By using this extension you may send the URL of pages you are currently visiting to your library's catalog server. Such information is sent <i>only</i> if you are actively using the extension; it is never sent automatically. If you wish to avoid this you must turn off the referrer URL by setting <a href="http://kb.mozillazine.org/Network.http.sendRefererHeader">network.http.sendRefererHeader to 0</a> in your preferences.</p>
        <p>In addition, you may be sending information such as ISBN and ISSN numbers to OCLC, DOIs to CrossRef's server, and PubMed IDs to the PubMed server in order to retrieve metadata information. If configured for your edition, you may also send URLs to your library's EZProxy to determine whether the current page can be proxied when using the right-click context menu. Use the LibX -&gt; Preferences panel to turn these services off if desired.</p>
        <p>For more information about LibX, visit the <a href="http://libx.org">LibX Homepage</a>.</p>
      </div>
      <div id="libxfaqs" class="faqs tabcontent-hide"></div>
      <div id="c-footer">
        LibX is distributed under the <a href="http://www.mozilla.org/MPL/MPL-1.1.html">Mozilla Public License</a>. <span class="c-copyright">&#169; 2012</span> Annette Bailey and <a href="http://www.vt.edu">Virginia Tech.</a>

      </div>
    </div>
  </body>
</html>
