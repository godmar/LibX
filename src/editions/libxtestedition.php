<html>
    <head>
        <link rel="stylesheet" type="text/css" href="http://libx.org/css/vtdoopal.css" />
<style>
.part {
    font-weight: bold;
}
.selectthis {
    color: green;
}
</style>
    </head>
<body>
<?
$version = "Test Edition";
$edition = $_GET['edition'];
if (!preg_match("/^[a-zA-Z0-9]+$/", $edition)) die ("Wrong argument.");

$edition_config = $edition . '/config';
$edition_xpi = $edition . '/libx-' . $edition . '.xpi';

if (!file_exists($edition_config)) {
    die ("No such test edition - check the edition argument; given was edition=" . $edition);
}

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
?>

<h2 class="title">LibX <? echo $edition_name ?> - Test Edition</h2>

<p>
<a target="_top" href="<? echo $edition ?>/libx-<? echo $edition ?>.xpi">
        Click here to install LibX <? echo $edition_name . ' --- Test Edition '?>
</a>
<p>

<ul>
<li>Last rebuilt on <font color="green"><b>
    <? echo date( "F d, Y. H:i:s a", filemtime($edition_xpi) ); ?>.
    </b></font>
<li>Last modification to config file was made <font color="green"><b>
    <? echo date( "F d, Y. H:i:s a", filemtime($edition_config) ); ?>.
    </b></font>
<li> <a href="<? echo $edition_config?>">config file</a> used to build this snapshot.
<li> An easier-to-read version of 
        the <a href="showconfigfile.php?edition=<? echo $edition; ?>">config file without comments.</a>
<li> Primary catalog type is <tt style="{ color: green }"><? echo $catalog_type ?></tt> at
    <tt style="{ color: green }"><? echo $CONFIG['$catalog.url'] ?></tt>
<? 
    if ($CONFIG['openurltype'] != "") {
        echo '<li> OpenURL resolver type is <tt style="{ color: green }">' . $CONFIG['openurltype'] . '</tt> at <tt style="{ color: green }">' . $CONFIG['openurlresolverurl'] . '</tt>';
    } else {
        echo '<li> No OpenURL resolver is defined for this edition.';
    }
    if ($CONFIG['proxytype'] != "") {
        echo '<li> Remote Access type is <tt style="{ color: green }">' . $CONFIG['proxytype'] . '</tt> at <tt style="{ color: green }">' . $CONFIG['proxyurl'] . '</tt>';
    } else {
        echo '<li> No remote proxy is defined for this edition.';
    }
    $icon = $edition . '/' . basename($CONFIG['emiconURL']);
    echo '<li> Small logo is <img src="' . $icon . '" />, which should look identical to ';
    echo '<img width="16" height="16" src="' . $icon . '" />';
    $logo = $CONFIG['logoURL'];
    if (preg_match('/chrome:\/\/libx\/skin/', $logo)) 
        $logo = $edition . '/' . basename($logo);
    echo '<li> Large logo is <img src="' . $logo . '" />';

    $oai = @$CONFIG['$catalog.xisbn.oai'];
    if ($oai != "") {
        echo '<li> xISBN Setup: you are using the following <a href="http://alcme.oclc.org/bookmarks/">OCLC OAI Bookmark identifier:</a> '
            . '<tt style="{ color: green }">' . $oai . '</tt>';
    } else {
        echo '<li> xISBN Setup: you currently are not using an <a href="http://alcme.oclc.org/bookmarks/">OCLC OAI Bookmark identifier.</a> Consider signing up.';
    }
?>

</ul>

<p>
<a href="<? echo $edition ?>/">Click here</a> for a listing of all files used in building this edition.
Please do not link to this edition, it is here solely for testing.
<p>
Editions linked from here may or may not work with your version of Firefox.
They do not benefit from automatic updates, and the config file they use may not
work with the current version of LibX.
<p>
If your edition is a "live" edition, the xpi file linked from this page
is different from the one to which you should point your users.
Your users should be pointed at the last vetted version located at
<tt>http://libx.org/editions/<? echo $edition ?>/libx-<? echo $edition ?>.xpi</tt>.
That xpi file should be linked from 
your <a href="/editions/<? echo $edition ?>/libx.html">edition's homepage</a>, not this one.
<p>
If we upgrade an edition, we will build a new test edition here first and ask you 
to test it. To test this edition, either use a <a target="_top" 
href="http://www.mozilla.org/support/firefox/profile#new">blank profile</a>, 
or uninstall your current edition first, then reinstall this edition.
<b>Don't forget to restart Firefox between uninstallation and reinstallation.</b>
<p>
<hr>
<div>
<b>Instructions for Testing:</b><p>
You should thoroughly test your edition.
<p>
<span class="part">Part 1: Toolbar</span>
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
<tt><? echo $CONFIG['emhomepageURL'] ?></tt>, this link won't work until 
the edition is live.  It will then point to where you offer your edition
to your users.
<p>

<span class="part">Part 2: Cues</span>
<p>
Each of these links will open in a new window.  
Make sure you click on each cue to see if it works.
<br />
You should be seeings cues on these pages: 
<ul>
<li><a target="_new" href="http://search.barnesandnoble.com/booksearch/isbnInquiry.asp?z=y&isbn=006073132X&itm=1">
        Barnes &amp; Noble</a>,
<li><a target="_new" href="http://www.amazon.com/gp/product/006073132X">Amazon</a>,
<li><a target="_new" href="http://www.booklistonline.com/default.aspx?page=show_product&pid=1611275">Booklistonline.com</a>,
<li><a target="_new" href="http://www.nytimes.com/2005/05/15/books/review/15HOLTL.html">NY Times Book Review (1)</a>,
<li><a target="_new" href="http://www.nytimes.com/2006/04/27/books/27masl.html">NY Times Book Review (2) (nytimes.com requires a login)</a>,
<li><a target="_new" href="http://www.google.com/search?hl=en&q=freakonomics">Google.com</a>,
<li><a target="_new" href="http://search.yahoo.com/search?ei=UTF-8&fr=sfp&p=freakonomics">Yahoo.com.</a>
</ul>
<p>
<span class="part">Part 3: Context-Menu</span>
<p>
To test your ISBN support, select this ISBN: <span class="selectthis">006073132X</span> by 
double-clicking on it. Right-click and select 
"Search <? echo $CONFIG['$catalog.name'] ?> for ISBN 006073132X".  
<p>
Test xISBN support, if activated, by right-clicking <span class="selectthis">006073132X</span>
and selecting "Search xISBN for ISBNs related to 006073132X".
<p>
Test that 13-digits EANs work: select <span class="selectthis">9780743226714</span> by 
double-clicking on it, it should be converted into a 10-digit ISBN, then proceed as above.
<p>
To test your ISSN support, select this ISSN: <span class="selectthis">0164-0925</span>.
Right-click and select  "Search <? echo $CONFIG['$catalog.name'] ?> for ISSN 0164-0925".
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
<? if ($CONFIG['openurltype'] != "") { ?>
Test DOI ID support.  Select this DOI <span class="selectthis">10.1145/268998.266642</span>, then
right-click and select "Search <? echo $CONFIG['openurlname'] ?> for DOI 10.1145/268998.266642".
<p>
Test PubMed ID support. Select this string <span class="selectthis">PMID: 3966281</span>, then
right-click and select "Search <? echo $CONFIG['openurlname'] ?> for Pubmed ID 3966281".
(You must include the "PMID:" part.)
<? } /* openurl configured */?>
<p>
<span class="part">Part 4: Scholar Support</span>
<p>
To test Scholar support, make sure, that you are either using an IP address that is recognized
by Scholar or that you have <a href="http://scholar.google.com/scholar_preferences?hl=en&lr=&output=search">set your preferences</a> to include a library that displays OpenURLs - your library, if you're registered with Scholar, or if not, pick any library that is (Find It @ Stanford is a good pick.)
<p>
<b>After</b> you have done this, select the following five entries, one at a time.
Select an <b>entire line</b> each time, right-click and pick "Search via Scholar."
<ol>
<li><span class="selectthis">HOMPACK90: A suite of FORTRAN 90 codes for globally convergent homotopy algorithms</span>
<li><span class="selectthis">Convergence of trust region augmented Lagrangian methods using variable fidelity approximation data</span>
<li><span class="selectthis">"The KaffeOS Java Runtime System." Godmar Back and Wilson C Hsieh. ACM Transactions on Programming Languages and Systems.</span>
<li><span class="selectthis">Unskilled and unaware of it: how difficulties in recognizing one's own incompetence lead to inflated self-assessments</span>
<li><span class="selectthis">The cellular automata paradigm for the parallel solution of heat transfer problems</span>
</ol>
Depending on the strength of your OpenURL resolver and depending on your holdings (or the holdings
of the library you set in your Scholar preferences), you should be led either to the publisher's
site for these pages, or to your OpenURL resolver page.  The last entry should lead to a tech report site.  
<p>
An additional tab opens each time with the result of the Scholar search LibX runs.  
Check that the links on the Scholar page have been replaced with your logo: <img src="<? echo $icon ?>" />
<br />
If you don't see your OpenURL resolver page after selecting "Search via Scholar" for at least 
one of the examples above, check that you are seeing your logo on the Scholar page.
<p>
Check that the Scholar button works from inside a PDF (Windows only).
Open <a href="http://www.cs.vt.edu/%7Egback/papers/jtres2005-cadus.pdf">this PDF file</a>, go to the references, and pick a title in the references, then drag and drop it onto the Scholar button.
<p>
Check that the Scholar button performs searches.  
Enter <span class="selectthis">unskilled and unaware</span> into the 
search bar (or select the text and drag-n-drop it in there), make sure "Keyword" is selected and then 
press the Scholar button.  
Also test searches by author and title, they should work with Scholar as well.
<p>
<? if ($CONFIG['openurltype'] != "" && @$CONFIG['$openurl.dontshowintoolbar'] != "true") { ?>
Since you display a "Search <? echo $CONFIG['openurlname'] ?>" option for your edition's OpenURL resolver,
you should also test that searches by title work.  Select Title in the left dropdown, 
then select your OpenURL resolver on the right, and search for journal title.  
You should be thrown into your E-Journal Search dialog.
This option is known to work well only for 
SFX &amp; Serials Solutions, and sirsi.net OpenURL resolvers.
<? } ?>
<p>
<? if ($CONFIG['proxytype'] != "") { ?>
<p>
<span class="part">Option: Proxy Support</span>
<p>
To test your proxy support, <a href="http://www.science-direct.com">right-click 
on this link to www.science-direct.com</a> and then select 
"Follow this Link via <? echo @$CONFIG['proxyname'] ?>".  Assuming your library proxies 
science-direct.com, you should be able to log on through your proxy (testing this may require
that you are off-campus.) 
<p>
To test reloading via proxy, <a target="_new" href="http://www.science-direct.com">go to science-direct.com in a new window</a> and once there, right-click and select "Reload this Page via <? echo @$CONFIG['proxyname'] ?>".  
It should reload the page through the proxy.
<p>
<? } /* proxy configured */?>

</div>
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
