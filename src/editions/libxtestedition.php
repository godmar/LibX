<?
// invoked with ?edition=vt
$version = "Test Edition";
$edition = @$_GET['edition'];
if (!preg_match("/^[a-zA-Z0-9\.]+$/", $edition)) die ("Wrong argument.");

$edition_config = $edition . '/config';
$edition_config_xml = $edition . '/config.xml';
$edition_xpi = $edition . '/libx-' . $edition . '.xpi';

if (!file_exists($edition_config)) {
    die ("No such test edition - check the edition argument; given was edition=" . $edition);
}

// read config file and store config entries in $CONFIG array
$f = fopen($edition_config, 'r');
while (!feof($f)) {
    $line = fgets($f, 1024);
    if (preg_match('/^#/', $line) || preg_match('/^\s*$/', $line))
        continue;
    $kv = explode("=", $line, 2);
    $CONFIG[$kv[0]] = rtrim($kv[1]);
}

$edition_name = $CONFIG['libxedition'];
$catalog_type = $CONFIG['$catalog.type'];
$icon = $edition . '/' . basename($CONFIG['emiconURL']);
$hasopenurl = @$CONFIG['$openurl.type'] != "";
?>

<html>
    <head>
      <link rel="stylesheet" type="text/css" href="http://libx.org/css/vtdoopal.css" />
      <link rel="icon" href="<? echo $icon ?>" type="image/x-icon" />
      <link rel="shortcut icon" href="<? echo $icon ?>" type="image/x-icon" />
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
}
</style>
    <title>
        LibX <? echo $edition_name ?> - Test Edition
    </title>
    </head>
<body>

<h2 class="title">LibX <? echo $edition_name ?> - Test Edition Page</h2>

<p>Quick Install:
<a target="_top" href="<? echo $edition ?>/libx-<? echo $edition ?>.xpi">
        Click here to install LibX <? echo $edition_name . ' --- Test Edition '?>
</a>
<p>
<p>This page contains links, status information, and testing instructions
for the test edition of LibX - <? echo $edition_name; ?>.
</p>

<h4>Edition Status</h4>
<ul>
<?  // output build version if given
    if (isset($CONFIG['libxversion'])) {
        echo '<li>Version of this build: <font color="red"><b>' 
            . $CONFIG['libxversion'] 
            . "</b></font>";
    }
?>

<li>Last rebuilt on 
    <font color="green"><b>
        <? echo date( "F d, Y. H:i:s a", filemtime($edition_xpi) ); ?>.
    </b></font>

<li>Last modification to config file was made 
    <font color="green"><b>
        <? echo date( "F d, Y. H:i:s a", filemtime($edition_config) ); ?>.
    </b></font>

<li> Direct link to 
    <a href="<? echo $edition_config?>">config file</a> used to build this snapshot.
    When submitting revisions, base those submissions on this config file.

<li> Direct link to the 
        <a href="showconfigfile.php?edition=<? echo $edition; ?>">config file 
        with the comments stripped out.</a>

    <? if (file_exists($edition_config_xml)) {
        echo '<a href="' . $edition_config_xml . '">(as XML)</a>';
    } ?>

<li>
    <a href="<? echo $edition ?>/">Click here</a> 
    for a directory listing all files used in building this edition.
</ul>

<h4>Catalog Settings</h4>
<ul>
<li> The following catalogs are configured:
    <hr width="90%">
    <table width="90%" border="0">
    <tr>
        <th>Catalog</th>
        <th>Name shown in Toolbar</th>
        <th>Type</th>
        <th>URL</th>
        <th><a href="#options">Options</a></th>
    </tr>
<?
    $c = 0;
    $prefix = "";
    while (@$CONFIG['$' . $prefix . 'catalog.type'] != "") {
        echo '<tr><td>';
        if ($c == 0) { 
            echo 'Primary'; 
        } else { 
            echo 'Catalog #'. $c; 
        }
        echo '</td><td>';
        echo '<a href="' . $CONFIG['$' . $prefix . 'catalog.url'] . '">' 
                . $CONFIG['$' . $prefix . 'catalog.name']. '</a>';
        echo '</td><td align="center"><tt style="{ color: green }">';
        $cattype = $CONFIG['$' . $prefix . 'catalog.type'];
        echo $cattype . '</tt>';
        echo '</td><td>';
        echo '<tt style="{ color: green }">';
        $u = $CONFIG['$' . $prefix . 'catalog.url'];
        if (strlen($u) > 40) { $u = substr($u, 0, 40) . " ..."; }
        echo $u;
        echo '</tt>';
        echo '</td><td class="searchoptions">';
        $copt = @$CONFIG['$' . $prefix . 'catalog.options'];
        if ($copt != "") {
            echo $copt;
        } else {
            if ($cattype == "sersol")
                echo 'jt;i';
            else if ($cattype == "sfx")
                echo 'jt;i';
            else
                echo 'Y;t;a;d;i;c';
        }
        echo '</td></tr>';
        $c++;
        $prefix = 'catalog' . $c . '.';
    }
?>
    </table>
    <hr width="90%">
<li> xISBN setup for primary catalog: 
<?
    $oai = @$CONFIG['$catalog.xisbn.oai'];
    if ($oai != "") {
        echo 'you are using the following ' 
            . '<a href="http://alcme.oclc.org/bookmarks/">OCLC OAI Bookmark identifier:</a> '
            . '<span class="url">' . $oai . '</span>';
    } else {
        echo 'you currently are not using an '
            . '<a href="http://alcme.oclc.org/bookmarks/">OCLC OAI Bookmark identifier.</a> '
            . 'Consider signing up for one. ';
        echo 'See the <a href="/faq.html#QL12">FAQ</a> for discussion.';
    }
?>
</ul>

<h4>OpenURL settings</h4>
<ul>
<? if ($hasopenurl) { 
        $openurl_image = $icon;
?>
        <li> OpenURL resolver type is 
                <span class="url">
                    <? echo $CONFIG['$openurl.type'] ?>
                </span> at <span class="url">
                    <? echo $CONFIG['$openurl.url'] ?> 
                </span>

        <li> Inserted OpenURL links are displayed using this image: 
            <img src="<?
                if (@$CONFIG['$openurl.image']) {
                    $openurl_image = $edition . '/' . basename($CONFIG['$openurl.image']);
                }
                echo $openurl_image;
               ?>"/>
<? } else { ?>
        <li>No OpenURL resolver is defined for this edition.
<? } /* else hasopenurl */ ?>
</ul>

<h4>Proxy Settings</h4>
<ul>
<?
    if (@$CONFIG['$proxy.type'] != "") {
        echo '<li> Remote Access type is <tt style="{ color: green }">' . $CONFIG['$proxy.type'] . '</tt> at <tt style="{ color: green }">' . $CONFIG['$proxy.url'] . '</tt>';
    } else {
        echo '<li> No remote proxy is defined for this edition.';
    }
?>
</ul>
<h4>Branding &amp; Logos</h4>
<ul>
<li> The small logo included in this edition is 
    <? echo '<img src="' . $icon . '" />' ?> - this logo is displayed in the
    toolbar, in the right-click menu, and in pages that display cues.
    The logo should have a height of 16px, and ideally, a width of 16px.
    The logo should look good when stretched to 16x16, as we do now:
    <? echo '<img width="16" height="16" src="' . $icon . '" />'; ?>

<li> Logos generally look better if their background is transparent, because
    then the background of the page on which it is placed will shine through.
    Here is the logo shown on a 
        <span style="background-color: black; color: white;">black background</span>:
    <? echo '<img style="background-color: black;" src="' . $icon . '" />'; ?>
    and on <span style="background-color: gray">gray background</span>: 
    <? echo        '<img style="background-color: gray;" src="' . $icon . '" />'; ?>
    The areas where you see black or gray shine through, respectively, is where
    your logo is transparent. If you don't see black or gray, your logo is not
    transparent.  

<li> Your large logo is 
<?
    $logo = $CONFIG['logoURL'];
    if (preg_match('/chrome:\/\/libx\/skin/', $logo)) 
        $logo = $edition . '/' . basename($logo);
    echo '<img src="' . $logo . '" />';
?>
    <br />
    This logo is only displayed in your "About Box."

</ul>

<h3>Purpose of this page</h3>
<p>
<i>Warning:</i>
This page is solely for the use of the edition maintainer/tester, it
is not intended for end users.  The same applies to the .xpi build
linked from this page.  Please do not link to this build.
<p>
This build may or may not work with your version of Firefox.
It will not benefit from automatic updates.
Occasionally, we may rebuild your test edition as we develop and
test LibX.  
<p>
If your edition is a "live" edition, the xpi file linked from this page
is different from the one to which you should point your users.
Your users should be pointed at the last vetted version located at
<tt>http://libx.org/editions/<? echo $edition ?>/libx-<? echo $edition ?>.xpi</tt>.
That xpi file should be linked from your 
<a href="/editions/<? echo $edition ?>/libx.html">edition's homepage</a>, 
<b>not</b> this one.  If you wish to make an edition live and are setting
up a homepage to do so,  make sure to use the correct link.
<p>
If we upgrade an edition, we will build a new test edition here first and ask you 
to test it. To test this edition, either use a <a target="_top" 
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
$ln = 1;
while (@$CONFIG['$link' . $ln . '.url'] != "") {
    echo '<li><a target="_new" href="'
        . $CONFIG['$link' . $ln . '.url'] . '">'
        . $CONFIG['$link' . $ln . '.label'] . '</a>';
    $ln++;
}
?>
</ol>

If you have an "edition homepage" link--typically the last link--to 
<span class="url"><? echo $CONFIG['emhomepageURL'] ?></span>, this link won't work 
until the edition is live.  It will then point to where you offer your edition
to your users.
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
<li><a target="_new" href="http://search.barnesandnoble.com/booksearch/isbnInquiry.asp?z=y&isbn=006073132X&itm=1">
        Barnes &amp; Noble</a> (8/18/06),
<li><a target="_new" href="http://www.amazon.com/gp/product/006073132X">Amazon</a> (8/18/06),
<li><a target="_new" href="http://www.amazon.co.uk/gp/product/1561840718">Amazon (UK)</a> (8/18/06),
<li><a target="_new" href="http://www.amazon.ca/gp/product/1550411993">Amazon (CA)</a> (8/16/06),
<li><a target="_new" href="http://www.booklistonline.com/default.aspx?page=show_product&pid=1611275">Booklistonline.com</a>,
<li><a target="_new" href="http://www.nytimes.com/2005/05/15/books/review/15HOLTL.html">NY Times Book Review (1)</a>,
<li><a target="_new" href="http://www.nytimes.com/2006/04/27/books/27masl.html">NY Times Book Review (2) (nytimes.com requires a login)</a>,
<li><a target="_new" href="http://www.google.com/search?hl=en&q=freakonomics">google.com</a>,
<li><a target="_new" href="http://www.google.ca/search?hl=en&q=freakonomics">google.ca</a> (8/18/06) - other countries should work as well,
<li><a target="_new" href="http://search.yahoo.com/search?ei=UTF-8&fr=sfp&p=freakonomics">Yahoo.com,</a>
<? if (@$CONFIG['$libx.supportcoins'] == "true") { ?>
<li><a target="_new" href="http://www.worldcatlibraries.org/wcpa/isbn/006073132X">WorldCat via COinS,</a>
<li> <span  class="Z3988" title="ctx_ver=Z39.88-2004&amp;rft_val_fmt=info:ofi/fmt:kev:mtx:journal&amp;rft.title=D-LIB&amp;rft.aulast=Van+de+Sompel&amp;rft.atitle=Generalizing+the+OpenURL+Framework+beyond+References+to+Scholarly+Works+The+Bison-Fut%C3%A9+Model&amp;rft.volume=7&amp;rft.issue=7/8&amp;rft.date=2001-07&amp;rft_id=http://www.dlib.org/dlib/july01/vandesompel/07vandesompel.html">You should be seeing a COinS icon here: </span> 
    <? if (@$CONFIG['$openurl.version'] == "1.0") { ?>
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
<?  if (@$CONFIG['$libx.autolink'] == "true") { ?>
<p>
<b>Autolink:</b> The autolink feature is enabled for this edition. 
Certain identifiers, such as ISBNs, ISSNs, etc. shown on a page, 
should turn into links. 
ISBNs &amp; ISSNs link to your catalog,
Examples: 006073132X, 0-06-073132-X, 9780060731328, 978-0-06-073132-8, 0098-7484.
<? if (@$CONFIG['$openurl.type'] != "") { ?>
<p>
DOIs and Pubmed IDs should link to your OpenURL resolver.
Examples: PMID: 16646082, 10.1103/PhysRevD.66.063511 
<? } ?>
<p>
To avoid too many false positives (numbers that look like ISBNs/ISSNs, and have
the correct checksum, but really aren't standard numbers), we conservatively
suppress some forms.
The following forms should <i>not</i> have turned into 
autolinks: 00987484 , 100987484 , 10098-7484 ,
006-073-132X , 006-073-1328 , 006-0731328, 006-073-132X, 006-073-1328.
<p>
You can also test this feature on: 
<a href="http://www.nature.com/nature/climate/index.html" target="_new">nature.com</a>.
<p>
Some pages have taken measures against this, for instance, you may have noticed
that there was an autolink on the Amazon.com page, but not on the Barnes&amp;Noble
page.  We have disabled autolinks for the ISBNs etc. that follow on this page 
so that you can test the context menu functionality next.
<p>
Although the new autolink functionality partially obsoletes the 
select &amp; right-click functionality of the context menu, please
test it nonetheless (because it does not work if the site took 
countermeasures, and because the user might have intentionally disabled
it, but still wishes to use the right-click selection functionality.)
<p>
Please report problems with this feature to libx.org@gmail.com.
<?  } ?>
<p>
<a class="suppressautolink"><!-- suppress autolink feature -->
To test your ISBN support, select this ISBN: 
<span class="selectthis">006073132X</span> by 
double-clicking on it. Right-click and select 
"Search <? echo $CONFIG['$catalog.name'] ?> for ISBN 006073132X".  
Here's another one: <span class="selectthis">055380202X</span>
<p>
Test xISBN support, if activated, by right-clicking <span class="selectthis">006073132X</span>
and selecting "Search xISBN for ISBNs related to 006073132X".
<p>
Test that 13-digits EANs work: select <span class="selectthis">9780743226714</span> by 
double-clicking on it, then proceed as above. It should be converted into a 10-digit ISBN.
<p>
To test your ISSN support, select this ISSN: <span class="selectthis">0164-0925</span>.
Right-click and select  "Search <? echo $CONFIG['$catalog.name'] ?> for ISSN 0164-0925".
</a> <!-- end of autolink suppressing a -->
<p>
Test author name heuristics.  
Select the following names in their entirety, then right-click and select
"Search <? echo $CONFIG['$catalog.name'] ?> by Author Now!":
<ul>
<li><span class="selectthis">James Joyce</span>
<li><span class="selectthis">Joyce, James</span>
<li><span class="selectthis">Joyce, J</span>
<li><span class="selectthis">H.G. Wells</span>
<li><span class="selectthis">T. Faulkner</span>
<li><span class="selectthis">Thomas C. Faulkner</span>
</ul> 
LibX should run a proper author search against your catalog.
<p>
<? if (@$CONFIG['$openurl.type'] != "") { ?>
<a class="suppressautolink"><!-- suppress autolink feature -->
Test DOI ID support.  
Select this DOI <span class="selectthis">10.1145/268998.266642</span>, then
right-click and select "Search <? echo $CONFIG['$openurl.name'] ?> for DOI 10.1145/268998.266642".
Here's another one to try: <span class="selectthis">10.1038/nature01097</span>
<p>
Test PubMed ID support. Select this string <span class="selectthis">PMID: 3966281</span>, then
right-click and select "Search <? echo $CONFIG['$openurl.name'] ?> for Pubmed ID 3966281".
(You must include the "PMID:" part.)
</a><!-- end suppress autolink feature -->
<? } /* openurl configured */?>

<?  if (@$CONFIG['$libx.autolink'] == "true") { ?>
<? } /* if autolink */ ?>

<p>
<span class="part">Part 4: Scholar Support</span>
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
Open <a href="http://www.cs.vt.edu/%7Egback/papers/jtres2005-cadus.pdf">this PDF file</a>, go to the references, and pick a title in the references, then drag and drop it onto the Scholar button.
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
search.
<p>
<? if (@$CONFIG['$openurl.type'] != "" && @$CONFIG['$openurl.dontshowintoolbar'] != "true") { ?>
Since you display a "Search <? echo $CONFIG['$openurl.name'] ?>" option for your 
edition's OpenURL resolver, you should also test that searches by title work.  
Select "Search <? echo $CONFIG['$openurl.name'] ?>" on the right,
then select Journal Title in the left dropdown, and search for a journal title.  
You should be thrown into your E-Journal Search dialog.
This option is known to work relatively well only for 
SFX &amp; Serials Solutions, and sirsi.net OpenURL resolvers.  It can be turned off.
<? } ?>
<p>
<? if (@$CONFIG['$proxy.type'] != "") { ?>
<p>
<span class="part">Option: Proxy Support</span>
<p>
To test your proxy support, <a href="http://www.sciencedirect.com">right-click 
on this link to www.sciencedirect.com</a> and then select 
"Follow this Link via <? echo @$CONFIG['$proxy.name'] ?>".  Assuming your library proxies 
science-direct.com, you should be able to log on through your proxy (testing this may require
that you are off-campus.) 
<p>
To test reloading via proxy, <a target="_new" href="http://www.sciencedirect.com">go to sciencedirect.com in a new window</a> and once there, right-click and select "Reload this Page via <? echo @$CONFIG['$proxy.name'] ?>".  
It should reload the page through the proxy.
<p>
<? } /* proxy configured */?>

</div>
<a name="options"></a><span class="part">Options</span>
<p>
The following drop-down options are supported.
<table border="0">
<tr><td class="searchoptions">Y</td><td>Keyword (do not use X here, even if you set $millenium.keyword=X to tell Millennium to use the X index for keyword searches.)</td></tr>
<tr><td class="searchoptions">t</td><td>Title</td></tr>
<tr><td class="searchoptions">a</td><td>Author</td></tr>
<tr><td class="searchoptions">d</td><td>Subject</td></tr>
<tr><td class="searchoptions">i</td><td>ISBN/ISSN</td></tr>
<tr><td class="searchoptions">c</td><td>Call Number</td></tr>
<tr><td class="searchoptions">j</td><td>Dewey Call Number (currently Millennium only)</td></tr>
<tr><td class="searchoptions">m</td><td>Genre (currently Millennium only)</td></tr>
<tr><td class="searchoptions">jt</td><td>Journal Title (SFX, SerSol, and Millennium only)</td></tr>
<tr><td class="searchoptions">at</td><td>Article Title (OpenURL only)</td></tr>
</table>
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
