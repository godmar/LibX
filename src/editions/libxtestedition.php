<?
$edition = @$_GET['edition'];
if (!preg_match("/^[a-zA-Z0-9\.]+$/", $edition)) die ("Wrong argument.");

?>

<html>
    <head>
      <link rel="stylesheet" type="text/css" href="http://libx.org/css/vtdoopal.css" />
<style>
</style>
    <title>
        Available revisions for LibX id <? echo $edition ?>
    </title>
    </head>
<body>

<h2>
        Available revisions for LibX edition <? echo "'" . $edition . "'"; ?>
</h2>
<ul>
<?
/* list all available revisions. */

$ls = popen("cd ../../../editions/; /bin/ls -d " . $edition . ".*", "r");
while (!feof($ls)) {
    $l = chop(fgets($ls, 4096));
    if ($l != "") {
        $v = split("\\.", $l);
        $rev = $v[count($v) - 1];
        echo "<li><p><a href=\"/editions/libxtestedition.php?edition=" . $edition . "." . $rev . "\">Revision #" . $rev. "</a></p>";
    }
}
pclose($ls);
?>
</ul>
<p>
If you are a user seeing this page after coming from the 
<a href="/editions.php">Editions</a> list, then this means that the maintainer
of this edition has made the edition public, but has not made it live.
Contact him or her and ask for the edition to be made live.
To find the maintainer, visit the
<a href="http://libx.org/editionbuilder">edition builder</a> system.
<p>
Before the switch to the new 
<a href="http://libx.org/editionbuilder">edition builder</a> system,
this URL was used to lead to an edition's test page.
It is now only here for backwards compatibility.
<p>
<b>Transition note for maintainers:</b>
If your edition was a "live edition", revision #1 will be the live edition 
and revision #2 will
be your current test edition.  If not, your current test edition is revision #1.
To maintain your edition, sign up for an account, then select the edition in the
"All Editions" tab, then "Request Ownership".
<p>
Reports bugs or any problems and suggestions to libx.editions@gmail.com
<p>

</body>
</html>
