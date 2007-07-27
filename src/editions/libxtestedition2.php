<?
/*
 * This is the new script to be used with the edition builder.
 * It's not in the CVS yet.
 */
// invoked with ?edition=vt
// script should sit above directory where editions are kept.

include('readconfigxml.php');
?>

<html>
    <head>
      <link rel="stylesheet" type="text/css" href="http://libx.org/css/vtdoopal.css" />
      <link rel="icon" href="<? echo $icon ?>" type="image/x-icon" />
      <link rel="shortcut icon" href="<? echo $icon ?>" type="image/x-icon" />

<script type="text/javascript" src="<? echo $libxbase ?>/chrome/libx/content/libx/libx.cs.js"></script>
<script type="text/javascript" src="<? echo $libxbase ?>/chrome/libx/content/libx/isbnutils.js"></script>
<script type="text/javascript" src="<? echo $libxbase ?>/chrome/libx/content/libx/libx.js"></script>
<script type="text/javascript" src="<? echo $libxbase ?>/chrome/libx/content/libx/openurl.js"></script>
<script type="text/javascript" src="<? echo $libxbase ?>/chrome/libx/content/libx/catalogs/catalog.js"></script>
<script type="text/javascript" src="<? echo $libxbase ?>/chrome/libx/content/libx/catalogs/milleniumopac.js"></script>
<script type="text/javascript" src="<? echo $libxbase ?>/chrome/libx/content/libx/catalogs/horizonopac.js"></script>
<script type="text/javascript" src="<? echo $libxbase ?>/chrome/libx/content/libx/catalogs/voyageropac.js"></script>
<script type="text/javascript" src="<? echo $libxbase ?>/chrome/libx/content/libx/catalogs/alephopac.js"></script>
<script type="text/javascript" src="<? echo $libxbase ?>/chrome/libx/content/libx/catalogs/sirsiopac.js"></script>
<script type="text/javascript" src="<? echo $libxbase ?>/chrome/libx/content/libx/catalogs/centralsearch.js"></script>
<script type="text/javascript" src="<? echo $libxbase ?>/chrome/libx/content/libx/catalogs/openURLCatalog.js"></script>
<script type="text/javascript" src="<? echo $libxbase ?>/chrome/libx/content/libx/catalogs/web2opac.js"></script>
<script type="text/javascript" src="<? echo $libxbase ?>/chrome/libx/content/libx/magicsearch.js"></script>
<script type="text/javascript">
libxClientSideCatalogInit("<? echo $edition_config_xml; ?>");
</script>

<style>
/* heading for Part1, Part2, etc. */
.part {
    font-weight: bold;
}
.selectthis {
    color: green;
    border: thin solid #000000;
}
.url {
    color: green;
    font-family: Courier;
}
.searchoptions {
    color: green;
    font-family: Courier;
    text-indent: 3em;
}
</style>
    <title>
        LibX <? echo $edition_name ?> - Test Edition
    </title>
    </head>
<body>
<h2 class="title">LibX <? echo $edition_name ?> - Test Edition Page</h2>

<? if ($edition_built) { ?>
<p>Quick Install:
<a target="_top" href="<? echo $edition_xpi ?>">
        Click here to install LibX <? echo $edition_name . ' --- Test Edition '?>
</a>
</p>
<? } ?>
<? 
if ($edition_exe_built) { 
	echo "<p>Quick Install:\n";
	echo "<a target='_top' href='$edition_exe'>\n";
	echo "\tClick here to install LibX for Internet Explorer $edition_name --- Test edition\n";
	echo "</a>\n</p>";
} 
?>

<p>This page contains links, status information, and testing instructions for 
LibX - <? echo $edition_name; ?>. This page is always in flux.</p>
<p><b>If you have any questions, comments, concerns regarding this page and how
testing a LibX edition works, do not hesitate to send email to libx.org@gmail.com.</b>
If you need help building your edition, feel free to grant shared ownership of your 
edition to libx.editions@gmail.com.  (Go to My Editions, select the edition,
click "Change Ownership", enter "libx.editions@gmail.com" and check the 
"Retain shared ownership" box.)

<h4>Revision Status</h4>
<ul>
<?  // output build version 
    if (@$revision != "") {
        echo '<li>This page displays the configuration of <b>revision #' . $revision . "</b>";
    } else {
        echo '<li>This page displays the configuration of the <b>live revision</b>';
    }
    echo '<li>Internal version of this revision: <b>' . $config['version'] . "</b>";
?>

<? if ($edition_built) { ?>
<li>XPI file last rebuilt on 
    <font color="green"><b>
        <? echo date( "F d, Y. H:i:s a", filemtime($edition_xpi) ); ?>.
    </b></font>
<? } else { ?>
<li><font color="red">
        This revision has not been built.
        Use the "Build Revision" button in the edition builder 
        under the "My Editions" tab to build it.
    </font>
        <br />
        However, you can already perform testing on the catalogs using the
        forms below.
<? } ?>

<li>Last modification to config file was made 
    <font color="green"><b>
        <? echo date( "F d, Y. H:i:s a", filemtime($edition_config_xml) ); ?>.
    </b></font>

<li> Direct link to 
    <a href="<? echo $edition_config_xml; ?>">config.xml file</a> for this revision.

<li>
    <a href="<? echo $editionpath ?>/">Click here</a> 
    for a directory listing all files used in building this edition.
</ul>

<h4>Catalog Settings</h4>
<p>The following catalogs are configured.
You can test these catalogs directly here, without building and installing your revision.
</p>
    <hr width="90%">
    <table width="100%" cellpadding="4" border="0">
    <tr>
        <th>Catalog</th>
        <th>Name shown in Toolbar</th>
        <th>Type</th>
        <th>URL</th>
        <th><a href="#options">Options</a></th>
        <th>xISBN</th>
    </tr>
<?
    $c = 0;
    foreach ($config->catalogs->children() as $catalog) {
        echo '<tr><td>';
        if ($c == 0) { 
            echo 'Primary'; 
            $catalog0 = $catalog;
        } else { 
            echo 'Catalog #'. $c; 
        }
        echo '</td><td>';
        echo '<a href="' . $catalog['url'] . '">' . $catalog['name'] . '</a>';
        echo '</td><td align="center"><tt style="{ color: green }">';
        $cattype = $catalog->getName();
        echo $cattype . '</tt>';
        echo '</td><td>';
        echo '<tt style="{ color: green }">';
        $u = $catalog['url'];
        if (strlen($u) > 40) { $u = substr($u, 0, 40) . " ..."; }
        echo $u;
        echo '</tt>';
        echo '</td><td class="searchoptions">';
        $copt = $catalog['options'];
        echo $copt;
        echo '</td><td>';
        if (@$catalog->xisbn['cues'] == "true") {
            echo '<b>Cues use xISBN</b><br />';
        }
        $oai = $catalog->xisbn['res_id'];
        if ($oai != "") {
            echo '<a href="http://xisbn.worldcat.org/liblook/listbookmarklets.htm">OCLC xISBN LibraryLookup OPAC Identifier</a> <span class="url">' . $oai . '</span>';
        } else {
            echo 'OPAC not registered. Linking by OPAC type.<br />' 
               . '<a href="http://xisbn.worldcat.org/liblook/howtolinkbyopactype.htm">(More info)</a>.';
        }
        echo '</td></tr>';

        /* Support live testing. */
        echo '<tr><td></td><td colspan="4">';
        echo '<form action="javascript:libxTestSearch('.$c.', \'stype'.$c.'\', \'sterm'.$c.'\');">';
        echo '<table><tr>';
        echo '<td><select id="stype' . $c . '">';
        $coptArr = explode (';', $copt);
        foreach ($coptArr as $opt) {
            echo '<option value="' . $opt. '">' . getSearchOptionLabel($opt) . '</option>';
        }
        echo '</select>';
        echo '</td>';
        echo '<td>';
        echo '<input type="text" id="sterm' . $c . '"/>';
        echo '</td>';
        echo '<td>';
        echo '<input type="submit" value="Test ' . $catalog['name'] . '"/>';
        echo '</td>';
        echo '</tr></table>';
        echo '</form>';
        echo '</td><td>';
        /* xISBN test */
        $testisbn = '006073132X';
        echo '<a href="javascript:libxEnv.openSearchWindow(catalogs['.$c.'].makeXISBNRequest(\''.$testisbn.'\'));">';
        echo 'Sample xISBN request: ' . $testisbn;
        echo '</a>';
        echo '</td></tr>';
        $c++;
    }
?>
    </table>

<h4>OpenURL settings</h4>
<?      
        $ocount = count($config->openurl->children());
        if ($ocount == 0) {
            echo 'No';
        } else {
            echo $ocount;
            // first openurl resolver is used in rest of page.
            $openurl = $config->openurl->resolver[0];
        }
        echo ' OpenURL resolver(s) are defined for this revision.';

        $openurl_image = $icon;
?>
<ul>
<?
        foreach ($config->openurl->children() as $resolver) {
                echo '<li> <a href="' . $resolver['url'] . '"/>' . $resolver['name'] . '</a>';
?>
            of type <span class="url">
                    <? echo $resolver['type'] ?>
                </span> at <span class="url">
                    <? echo $resolver['url'] ?> 
                </span>

            using icon <img src="<?
                if (@$resolver['image']) {
                    $openurl_image = $editionpath . '/' . basename($resolver['image']);
                }
                echo $openurl_image;
             ?>"/>
<?      }       /* end of foreach */
?>

</ul>
<p>Note: as of 7/19/2007, LibX uses only the first OpenURL resolver, the others are ignored, 
but they will be used in the future.</p>

<h4>Proxy Settings</h4>
<p>The following remote access proxies are configured for this edition:</p>
<ul>
<?
    foreach ($config->proxy->children() as $proxy) {
        echo '<li><tt style="{ color: green }">' 
            . $proxy->getName() 
            . '</tt> at <tt style="{ color: green }">' 
            . $proxy['url'] 
            . '</tt>';
    } 
    if (count($config->proxy->children()) == 0) {
        echo '<li> No remote access proxy is defined for this edition.';
    } else {
        $proxy = $config->proxy->children();
        $proxy = $proxy[0];
    }
?>
</ul>
<p>Note: as of 7/19/2007, LibX uses only the first configured proxy, the others are ignored, 
but they will be used in the future.</p>

<h4>Branding &amp; Logos</h4>
<ul>
<li><p>The small logo included in this edition is 
    <? echo '<img src="' . $icon . '" />' ?> - this logo is displayed in the
    toolbar, in the right-click menu, and in pages that display cues.
    The logo should have a height of 16px, and ideally, a width of 16px.
    The logo should look good when stretched or shrunk to 16x16, as we do now:
    <? echo '<img width="16" height="16" src="' . $icon . '" />'; ?></p>
</li>

<li><p>Logos generally look better if their background is transparent, because
    then the background of the page on which it is placed will shine through.
    Here is the logo shown on a 
        <span style="background-color: black; color: white;">black background</span>:
    <? echo '<img style="background-color: black;" src="' . $icon . '" />'; ?>
    and on <span style="background-color: gray">gray background</span>: 
    <? echo        '<img style="background-color: gray;" src="' . $icon . '" />'; ?>
    The areas where you see black or gray shine through, respectively, is where
    your logo is transparent. If you don't see black or gray, your logo is not
    transparent.  </p>

<table>
    <tr><td valign="top" width="20%" >
        <p>Your large logo is shown on the right.
        This logo is only displayed in your "About Box."</p>
    </td>
    <td> 
<?
    $logokey = $config->xpath('/edition/options/option[@key="logo"]');
    $logo = $logokey[0]['value'];
    if (preg_match('/chrome:\/\/libx\/skin/', $logo)) 
        $logo = $editionpath . '/' . basename($logo);
    echo '<img src="' . $logo . '" />';
?>
    </td></tr>
</table>
</li>

</ul>

<h3>Purpose of this page</h3>
<p>
<i>Warning:</i>
This page is solely for the use of the edition maintainer/tester, it
is not intended for end users.  
<p>
To test this revision, either use a <a target="_top" 
href="http://www.mozilla.org/support/firefox/profile#new">blank profile</a>, 
or install this edition over your current edition.  (We believe that in 1.5.0.3 
and higher, it is no longer necessary to uninstall the current version first.)
In all versions, <b>don't forget to restart Firefox afterwards.</b>
To install over your current edition, simply drag and drop the link to the
.xpi file into the address bar.
<p>
<hr>
<div>
<h3>Instructions for Testing:</h3>
You should thoroughly test your edition.
<p>
<h4>Part 1: Toolbar</h4>
<p>
Try out keyword searches, title searches, author searches, ISBN/ISSN, and call number
searches from the toolbar for all catalogs you have configured and see if they work 
to your satisfaction.
<p>
Use the blue down button in the toolbar to create 
multiple-term searches (author + title, author + keyword, etc.)
<p>
Check that the links you want displayed to your users in the top-left dropdown
menu work.  You configured the following links (they open in a new window.)

<ol>
<?
foreach ($config->links->children() as $link) {
    if (@$link['href'] != "") {
        echo '<li><a target="_new" href="'
            . $link['href'] . '">'
            . $link['label'] . '</a>';
    } else {
        echo '<li><b>' . $link['label'] . '</b>';
    }
}
?>
</ol>
If you have an "edition homepage" link--typically the last link--to 
<span class="url"><? echo $config->name['localhomepage'] ?></span>, 
this link won't work until the edition is live.  It will then point 
to where you offer your edition to your users.
<p>

<h4>Part 2: Cues</h4>
<p>
Each of these links will open in a new window.  
Make sure you click on each cue to see if it works.
<br />
You should be seeings cues on these pages.  (If there is a date in parentheses,
this indicates that your edition must have been rebuilt after that date for
the cue to work.)
<ul>
<li><a target="_new" href="http://www.abebooks.com/servlet/BookDetailsPL?bi=936276021">abebooks.com</a> (7/23/2007)

<li><a target="_new" href="http://www.alibris.com/search/search.cfm?qwork=8803863&wtit=historian&matches=501&qsort=r&cm_re=works*listing*title">alibris.com</a> (5/11/07)
<li><a target="_new" href="http://search.barnesandnoble.com/booksearch/isbnInquiry.asp?z=y&isbn=006073132X&itm=1">
        Barnes &amp; Noble</a> (8/18/06),
<li><a target="_new" href="http://www.amazon.com/gp/product/006073132X">Amazon</a> (8/18/06),
<li><a target="_new" href="http://www.amazon.co.uk/gp/product/1561840718">Amazon (UK)</a> (8/18/06),
<li><a target="_new" href="http://www.amazon.ca/gp/product/1550411993">Amazon (CA)</a> (8/16/06),
<li><a target="_new" href="http://www.booklistonline.com/default.aspx?page=show_product&pid=1611275">Booklistonline.com</a>,
<li><a target="_new" href="http://www.nytimes.com/2005/05/15/books/review/15HOLTL.html">NY Times Book Review (1)</a>,
<li><a target="_new" href="http://www.nytimes.com/2006/04/27/books/27masl.html">NY Times Book Review (2) (nytimes.com requires a login)</a>,
<li><a target="_new" href="http://www.google.com/search?hl=en&q=freakonomics">google.com</a> (3/14/07),
<li><a target="_new" href="http://www.google.ca/search?hl=en&q=freakonomics">google.ca</a> (3/14/07) - other countries should work as well,
<li><a target="_new" href="http://search.yahoo.com/search?ei=UTF-8&fr=sfp&p=freakonomics">Yahoo.com,</a>
<? if (getOption('supportcoins') == "true") { ?>
<li><a target="_new" href="http://www.worldcatlibraries.org/wcpa/isbn/006073132X">WorldCat via COinS,</a>
<li> <span  class="Z3988" title="ctx_ver=Z39.88-2004&amp;rft_val_fmt=info:ofi/fmt:kev:mtx:journal&amp;rft.title=D-LIB&amp;rft.aulast=Van+de+Sompel&amp;rft.atitle=Generalizing+the+OpenURL+Framework+beyond+References+to+Scholarly+Works+The+Bison-Fut%C3%A9+Model&amp;rft.volume=7&amp;rft.issue=7/8&amp;rft.date=2001-07&amp;rft_id=http://www.dlib.org/dlib/july01/vandesompel/07vandesompel.html">You should be seeing a COinS icon here: </span> 
    <? if (@$openurl['version'] == "1.0") { ?>
    <li> 
    <span 
       class="Z3988" 
       title="ctx_ver=Z39.88-2004&rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Adissertation&rfr_id=info%3Asid%2Focoins.info%3Agenerator&rft.title=Isolation%2C+Resource+Management+and+Sharing+in+the+KaffeOS+Java+Runtime+System&rft.aulast=Back&rft.aufirst=Godmar&rft.date=2001&rft.cc=USA&rft.inst=University+of+Utah&rft.degree=PhD">
      Since your OpenURL resolver supports OpenURL 1.0, there should be a second COinS icon with genre dissertation here: 
    </span>
    <? } ?>

<? } ?>
<li><a target="_new" href="http://www.ecampus.com/book/0201549794">ecampus.com (1)</a>,
<a target="_new" href="http://www.ecampus.com/bk_detail.asp?isbn=0201702452">ecampus.com (2),</a>
<li><a target="_new" href="http://www.powells.com/biblio/1-0743226712-2">powells.com,</a>
<li><a target="_new" href="http://www.chapters.indigo.ca/books/item/books-978155041577/">chapters.ca</a> (10/12/2006)
</ul>
<p>
<span class="part">Part 3: Context-Menu</span>
<p>
<!--
In this section of the test, you have to select and right-click on information 
that is <span class="selectthis">displayed like this</span>.
-->
<?  if (getOption("autolink") == "true") { ?>
    <p>
    <b>Autolink:</b> The autolink feature is enabled for this edition. 
    Certain identifiers, such as ISBNs, ISSNs, etc. shown on a page, 
    should turn into links. 
    ISBNs &amp; ISSNs link to your catalog,
    Examples: 006073132X, 0-06-073132-X, 9780060731328, 978-0-06-073132-8, 0098-7484.
    <? if (@$openurl['type'] != "") { ?>
        <p>
        DOIs and Pubmed IDs should link to your OpenURL resolver.
        Examples: PMID: 16646082, 10.1103/PhysRevD.66.063511 
    <? } ?>
    <p>To avoid too many false positives (numbers that look like ISBNs/ISSNs, and have
    the correct checksum, but really aren't standard numbers), we conservatively
    suppress some forms.
    The following forms should <i>not</i> have turned into 
    autolinks: 00987484 , 100987484 , 10098-7484 ,
    006-073-132X , 006-073-1328 , 006-0731328, 006-073-132X, 006-073-1328.
    </p>

    <p>You can also test this feature on: 
    <a href="http://www.nature.com/nature/climate/index.html" target="_new">nature.com</a>.</p>

    <p>Some pages have taken measures against this, for instance, you may have noticed
    that there was an autolink on the Amazon.com page, but not on the Barnes&amp;Noble
    page.  We have disabled autolinks for the ISBNs etc. that follow on this page 
    so that you can test the context menu functionality next.</p>

    <p>Although the new autolink functionality partially obsoletes the 
    select &amp; right-click functionality of the context menu, please
    test it nonetheless (because it does not work if the site took 
    countermeasures, and because the user might have intentionally disabled
    it, but still wishes to use the right-click selection functionality.)</p>
    <p>Please report problems with this feature to libx.org@gmail.com.</p>
<?  }  ?>

<p>
<a class="suppressautolink"><!-- suppress autolink feature -->
To test your ISBN support, select this ISBN: 
<span class="selectthis">006073132X</span> by 
double-clicking on it. Right-click and select 
"Search <? echo $catalog0['name'] ?> for ISBN 006073132X".  
Here's another one: <span class="selectthis">055380202X</span></p>

<p>Test xISBN support, if activated, by right-clicking <span class="selectthis">006073132X</span>
and selecting "Search xISBN for ISBNs related to 006073132X".</p>

<p>Test that 13-digits EANs work: select <span class="selectthis">9780743226714</span> by 
double-clicking on it, then proceed as above. It should be converted into a 10-digit ISBN.</p>

<p>To test your ISSN support, select this ISSN: <span class="selectthis">0164-0925</span>.
Right-click and select  "Search <? echo $catalog0['name'] ?> for ISSN 0164-0925".
</a> <!-- end of autolink suppressing a --></p>

<p>
Test author name heuristics.  
Select the following names in their entirety, then right-click and select
"Search <? echo $catalog0['name'] ?> for Author ...":
<ul>
<li><span class="selectthis">James Joyce</span>
<li><span class="selectthis">Joyce, James</span>
<li><span class="selectthis">Joyce, J</span>
<li><span class="selectthis">H.G. Wells</span>
<li><span class="selectthis">T. Faulkner</span>
<li><span class="selectthis">Thomas C. Faulkner</span>
</ul> 

<p>LibX should run a proper author search against your catalog.
Observe that the "for Author" option is different from the other options in the right-click menu.
</p>

<? if (@$openurl['type'] != "") { ?>
    <p><a class="suppressautolink"><!-- suppress autolink feature -->
    Test DOI ID support.  
    Select this DOI <span class="selectthis">10.1145/268998.266642</span>, 
    then right-click and select "Search <? echo $openurl['name'] ?> for DOI 10.1145/268998.266642".
    Here's another one to try: <span class="selectthis">10.1038/nature01097</span></p>

    <p>Test PubMed ID support. Select this string <span class="selectthis">PMID: 3966281</span>, 
    then right-click and select "Search <? echo $openurl['name'] ?> for Pubmed ID 3966281".
    (You must include the "PMID:" part when selecting.)
    </a><!-- end suppress autolink feature -->
<? } /* openurl configured */?>

<p>
<span class="part">Part 4: Scholar Support</span>
<p>
Google Scholar changed their page layout in early Feb 2007.
<b>
Your LibX edition must have been built (or rebuilt) after Feb 8, 2007
for the Scholar heuristics to work properly.
</b>
<p>
To test Scholar support, make sure that you are either using an IP address that is recognized
by Scholar or that you have <a href="http://scholar.google.com/scholar_preferences?hl=en&lr=&output=search">set your preferences</a> to include a library that displays OpenURLs - your library, if you're registered with Scholar, or if not, pick any library that is (Find It @ Stanford is a good pick.)
<p>
<b>After</b> you have done this, select the following five entries, one at a time.
Select an <b>entire line</b> each time, right-click and pick "Search via Scholar."
<ol>
<li><span class="selectthis">HOMPACK90: A suite of FORTRAN 90 codes for globally convergent homotopy algorithms</span>
<li><span class="selectthis">Convergence of trust region augmented Lagrangian methods using variable fidelity approximation data</span>
<li><span class="selectthis">"The KaffeOS Java Runtime System." Godmar Back and Wilson C Hsieh. ACM Transactions on Programming Languages and Systems.</span>
<li><span class="selectthis">Unskilled and unaware of it: how difficulties in recognizing one's own incompetence lead to inflated self-assessments</span>
<li><span class="selectthis">Analog of Photon-Assisted Tunneling in a Bose-Einstein Condensate</span>
<li><span class="selectthis">The cellular automata paradigm for the parallel solution of heat transfer problems</span>
</ol>
Depending on the strength of your OpenURL resolver and depending on your 
holdings (or the holdings of the library you set in your Scholar preferences), 
you should be led either to the publisher's site for these pages, or to your 
OpenURL resolver page.  The last entry should lead to a tech report site.  
<p>
An additional tab opens each time with the result of the Scholar search LibX runs.  
Check that the links on the Scholar page have been replaced with your 
logo: <img src="<? echo $openurl_image ?>" />
<br />
If you don't see your OpenURL resolver page after selecting "Search via Scholar" for at least 
one of the examples above, check first that you are seeing your logo on the Scholar page.
Since we do not have control of the layout Google uses on the Scholar page, it
may be possible that LibX finds a different layout than what it expected, preventing
it from recognizing when an item was found.
In this case, the user will have to manually select the icon on the Scholar page
to get to the item, as if they had themselves searched Scholar.
<p>
Check that the Scholar button works from inside a PDF (Windows only).
Open <a href="http://www.cs.vt.edu/%7Egback/papers/jtres2005-cadus.pdf">this PDF file</a>, 
go to the references, and pick a title in the references, then drag and drop it 
onto the Scholar button.
<p>
Some additional tests that are a little bit more challenging for LibX (select the entire box):
<ol>
<li><div class="selectthis">
Hastings, R. J. &amp; Johnson, E. (2001). Stress in UK families<br />
conducting intensive home-based behaviour intervention<br />
for young children with autism. Journal of Autism and<br />
Developmental Disorders, 31, 327-336.<br />
</div>
<li><span class="selectthis">Llewellyn, G. (1994). Parenting: a neglected human</span>
</ol>
<p>
Check that the "Search Google Scholar" option in the list of catalogs works.
Enter <span class="selectthis">unskilled and unaware</span> into the 
search bar (or select the text and drag-n-drop it in there), make sure "Keyword" is selected 
and then press the "Search Google Scholar" button from the drop-down menu.
Also test searches by author, article title, and journal title.
they should work with Scholar as well -- they correspond to "author:", "allintitle:", and
the journal title search corresponds to Scholar's "published as" option in the advanced
search.</p>

<? if (@$openurl['type'] != "") { ?>
    <p>Since you display a "Search <? echo $openurl['name'] ?>" option for your 
    edition's OpenURL resolver, you should also test that searches by title work.  
    Select "Search <? echo $openurl['name'] ?>" on the right,
    then select Journal Title in the left dropdown, and search for a journal title.  
    You should be thrown into your E-Journal Search dialog.
    This option is known to work relatively well only for 
    SFX &amp; Serials Solutions, and sirsi.net OpenURL resolvers.  It can be turned off.</p>
<? } ?>

<p>
<? if (isset($proxy) && $proxy->getName() != "") { ?>
    <p><span class="part">Option: Proxy Support</span></p>
    <p>To test your proxy support, <a href="http://www.sciencedirect.com">right-click 
    on this link to www.sciencedirect.com</a> and then select 
    "Go To www.sciencedirect.com via <? echo $proxy['name'] ?>".  Assuming your library proxies 
    science-direct.com, you should be able to log on through your proxy 
    (testing this feature may require that you are off-campus.) </p>
    <p>To test reloading the current page via proxy, 
        <a target="_new" href="http://www.sciencedirect.com">
                go to sciencedirect.com in a new window or tab</a> 
        and once there, right-click and select "Reload www.sciencedirect.com via <? echo $proxy['name'] ?>".  
    </p>
    <p>It should reload the page through the proxy.</p>
<? } /* proxy configured */?>

</div>
<a name="options"></a><span class="part">Options</span>
<p>
<p>The following drop-down options are supported.</p>
<table border="0">
<tr><td colspan="2"><b>Built-in Options</b></td></tr>
<tr><td class="searchoptions">Y</td><td>Keyword (do not use X here, even 
        if you set $millenium.keyword=X to tell Millennium to use the X index 
        for keyword searches.)</td></tr>
<tr><td class="searchoptions">t</td><td>Title</td></tr>
<tr><td class="searchoptions">a</td><td>Author</td></tr>
<tr><td class="searchoptions">d</td><td>Subject</td></tr>
<tr><td class="searchoptions">i</td><td>ISBN/ISSN</td></tr>
<tr><td class="searchoptions">c</td><td>Call Number</td></tr>
<tr><td class="searchoptions">j</td><td>Dewey Call Number (currently Millennium only)</td></tr>
<tr><td class="searchoptions">m</td><td>Genre (currently Millennium only)</td></tr>
<tr><td class="searchoptions">jt</td><td>Journal Title (only supported on some catalogs)</td></tr>
<tr><td class="searchoptions">at</td><td>Article Title (OpenURL only)</td></tr>
<tr><td colspan="2"><b>User-defined Options</b></td></tr>
<?  foreach ($config->xpath('/edition/searchoptions/*') as $soption) { ?>
        <tr><td class="searchoptions">
        <? echo $soption['value']; ?>
        </td><td>
        <? echo $soption['label']; ?> (User-defined)
        </td></tr>
<?  } ?>
</table>
<hr>
<? if (file_exists($exp_edition_xpi)) { ?>
<p>There is an experimental build from
    <font color="green">
        <? echo date( "F d, Y. H:i:s a", filemtime($exp_edition_xpi) ); ?>
    </font>
in this directory.
You should install this build only if so instructed.<br />
<a target="_top" href="<? echo $exp_edition_xpi ?>">
        Click here to install LibX <? echo $edition_name . ' --- Experimental Build '?>
</a>
<p>
<? } ?>
<hr>
<p>
<b>Copyright:</b><p>
LibX is distributed under the 
<a href="http://www.mozilla.org/MPL/MPL-1.1.html">Mozilla Public License.</a>
The copyright is held jointly by Annette Bailey and Virginia Tech.
<p>

<a href="/editionsintesting.php">Go back to list of editions in testing</a>
<p>
<a href="/">Go To The LibX Homepage</a>
</body>
</html>
