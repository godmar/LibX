<html>
    <head>
        <link rel="stylesheet" type="text/css" href="http://libx.org/css/vtdoopal.css" />
    </head>
<body>
<?
$version = "Test Edition";
$edition = $_GET['edition'];
$edition_config = $edition . '/config';

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
    <? echo date( "F d, Y. H:i:s a", filemtime($edition_config) ); ?>.
    </b></font>
<li> <a href="<? echo $edition_config?>">config file</a> used to build this snapshot.
<li> Primary catalog type is <tt><? echo $catalog_type ?>.</tt>
<? 
    if ($CONFIG['openurltype'] != "") {
        echo '<li> OpenURL resolver type is <tt>' . $CONFIG['openurltype'] . '.</tt>';
    } else {
        echo 'No OpenURL resolver is defined for this edition.';
    }
    if ($CONFIG['proxytype'] != "") {
        echo '<li> Remote Access type is <tt>' . $CONFIG['proxytype'] . '.</tt>';
    } else {
        echo 'No remote proxy is defined for this edition.';
    }
    $icon = $edition . '/' . basename($CONFIG['emiconURL']);
    echo '<li> Small logo is <img src="' . $icon . '" />, which should look identical to ';
    echo '<img width="16" height="16" src="' . $icon . '" />';
    $logo = $CONFIG['logoURL'];
    if (preg_match('/chrome:\/\/libx\/skin/', $logo)) 
        $logo = $edition . '/' . basename($logo);
    echo '<li> Large logo is <img src="' . $logo . '" />';
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
<p>

<b>Copyright:</b><p>
LibX is distributed under the 
<a href="http://www.mozilla.org/MPL/MPL-1.1.html">Mozilla Public License.</a>
The copyright is held jointly by Annette Bailey and Virginia Tech.
<p>

<a href="/">Go To The LibX Homepage</a>
</body>
</html>
