<?
include ('readconfigxml.php');
?>

<html>
    <head>
        <link rel="stylesheet" type="text/css" href="http://libx.org/css/vtdoopal.css" />
        <link rel="icon" href="<? echo $icon ?>" type="image/x-icon" />
        <link rel="shortcut icon" href="<? echo $icon ?>" type="image/x-icon" />
        <base target="_top" />
<style>
.floatright {
    float : right;
}
</style>
    <title>
    LibX <? echo $edition_name ?>
    </title>
</head>
<body>

<h2 class="title">LibX <? echo $edition_name ?></h2>
<p>
<table>
<tr><td width="658">
<span class="text"><font color="green">
<a target="_top" href="<? echo $editionpath ?>/libx-<? echo $edition ?>.xpi">Click here to install LibX 
        <? echo $edition_name . ' Version ' . $version ?>
</a>
<img style="height:16px" src="<? echo $icon; ?>"/>
<p>
If you have trouble installing LibX, <a href="#installation">see below.</a> 

<?
if ($edition == 'yours') {
    echo '<p>If you consider creating an library for your library, you should read the ' 
        . '<a target="_self" href="/faq.html">FAQ</a>; you may also want to check out the '
        . '<a target="_self" href="/editionsintesting.php">editions in testing for examples.</a>'
        . '<p';
}
?>

</p>
</font> </span>

<span class="text">
<p>
    <img src="images/toolbar_transparentcropped.jpg" title="LibX Toolbar" border="1">
    <img src="<? echo $icon; ?>" class="floatright" border="0" 
         style="position: relative; right:634px; bottom:134px; height:16px" />
</p>
<p align="left">LibX <? echo $edition_name ?> is a Firefox extension that provides direct access to your Library's resources. 

It features: </p>
<p align="left">
    <img src="images/right_click_transparent2.jpg" alt="Context Menu" class="floatright" border="1" />
    <img src="<? echo $icon; ?>" class="floatright" border="0" 
         style="position: relative; left:66px; top:149px; height:16px" />
</p>
<p align="left"><b>Toolbar &amp; right-click context menu:</b> Search your library catalog directly from the LibX toolbar or using the right-click context menu.

</p>
<p><b>Support for off-campus access via EZProxy/WAM:</b> Using the Library's off-campus proxy, you may reload a page through the proxy, or follow a link via the proxy, making it appear as though you are coming from an on-campus computer. </p>

<p><b>Quick full text access to journal articles:</b> LibX uses Google Scholar to search for articles and directs the user to the electronic copy subscribed to by your Library. Select  a citation, then drag-and-drop it onto the Scholar button on the toolbar. You can use this feature even from inside a PDF file, which makes retrieving papers referenced in a PDF file a snap.<br>
To use this feature, your library must be a Google Scholar library, or you
must activate this link in the Firefox profile in which LibX is installed: <a href="http://scholar.google.com/scholar_setprefs?num=10&amp;instq=&amp;inst=sfx-f7e167eec5dde9063b5a8770ec3aaba7&amp;q=einstein&amp;inststart=0&amp;submit=Save+Preferences">
Activate Google Scholar support.</a> (See also <a href="http://libx.org/faq.html#QL9">LibX FAQ Question 11</a>)</p>

<p align="left"> 
    <img src="images/cue_amazon1.jpg" class="floatright" border="1" />
    <img src="<? echo $icon; ?>" class="floatright" border="0" 
         style="position: relative; left:135px; top:24px; height:16px" />
</p>
<p><b>Support for embedded cues:</b> LibX places cues <a title="Search <? echo @$CONFIG[0]['$catalog.name']; ?> for ISBN 0684824906" href="http://addison.vt.edu/search/?searchtype=i&amp;searcharg=0684824906&amp;startLimit=&amp;searchscope=1&amp;SORT=R&amp;endLimit=&amp;sid=libxvt"><img style="height:16px" src="<? echo $icon; ?>" border="0"></a> in web pages you visit 
if your library has resources related to that page.  Whenever you see the cue,
click on the link to look at what the Library has to offer.
For instance, book pages at Amazon or Barnes &amp; Noble will contain cues 
that link to the book's entry in Addison.
Cues are displayed at Google, Yahoo! Search, the NY Times Book Review, and other pages.
Watch <a target="_top" href="http://libx.org/screencasts/demo3.htm">this screencast for examples of this cool feature.</a> (requires Macromedia Flash Plugin)</p>

<p><b>Support for xISBN:</b>
A book title can have different ISBNs for the paperback, the hardcover, even for different editions.
LibX supports OCLC's <a target="_top" href="http://www.oclc.org/research/researchworks/xisbn/default.htm">xISBN service:</a> 
you can find a book, given an ISBN, even if the library holds this book under a different ISBN.</p>

<a name="installation"></a>
<h3>Installation:</h3>
</p><p>
<font color="green">
<a href="<? echo $editionpath ?>/libx-<? echo $edition ?>.xpi">Click here to install LibX 
        <? echo $edition_name . ' Version ' . $version ?>
</a>
</font>
<p>
If Firefox displays a message "To protect your computer, Firefox prevented
this site... from installing software on your computer.", press the
button labelled "Edit Options..." and click "Allow" add
<strong>libx.org</strong> to the list of websites from which extensions may be
installed. Then click "Ok" and visit the "Install" link again.</span><span class="text"></span><span class="text">
<p>
This extension works with <a href="http://getfirefox.com/">Firefox</a>
only. It does not work with other browsers such as Internet Explorer or Safari. 
It has been tested with Firefox versions 1.5 - 2.0.0.14 on Windows, Linux, 
and Macintosh OS-X.  Versions built after April 2008 also support Firefox 3.0.
</p>

<b>Copyright:</b>
<p>
LibX is distributed under the <a href="http://www.mozilla.org/MPL/MPL-1.1.html">Mozilla Public License.</a>
The copyright is held jointly by Annette Bailey and Virginia Tech.
</p><p>

<b>Privacy:</b>
</p><p>
By using this extension you may send the
URL of pages you are currently visiting to your library's
catalog server. Such information is sent <i>only</i> if you are
actively using the extension; it is never sent automatically. 

If you wish to avoid this you must turn off the referrer URL by 
setting <a href="http://www.mozilla.org/quality/networking/docs/netprefs.html">network.http.sendRefererHeader to 0</a> 

in your preferences.</p>
<p>In addition, you may be sending information such as ISBN numbers to OCLC.
Use LibX -&gt; Preferences -&gt; AJAX Options to turn this services off if desired.
</p>

<p>For more information about LibX, visit the <a href="http://libx.org">LibX Homepage</a>.
</p></span>

</td></tr></table>

</body>
</html>
