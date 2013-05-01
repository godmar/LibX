<?
/*
 * Read a config.xml file.
 */

$edition = @$_GET['edition'];
$libxbase = "/libx/src/base";
$libx2base = "/libx2/libx2-git";

/* on libx.org only */
$libxiedir = "/home/www/libx.org/libx/src/editions/LibXIE";
$libxiedll = $libxiedir . "/LibXIE.dll";
$editiondir = isset($editiondir) ? $editiondir : "";
$oldeditionformat = false;
// edition ids must be all alphanumerical.
if (!preg_match("/^[a-zA-Z0-9\.]+$/", $edition)) die ("Wrong argument.");
if ($edition{0} >= 'a' && $edition{0} <= 'z') {
    $editionpath = $editiondir . $edition;
    $oldeditionformat = true;
} else {
    $editiondir = $editiondir . substr($edition, 0, 2) . "/" . substr($edition, 2, 2) . "/";
    $editionpath = $editiondir . $edition;
}

/* Some edition ids have periods in them.  This was a bad idea, we must now handle it.
 * vt.1 and ittdublin.ie looks very similar.  Check whether the string after the last .
 * is a number. If so, interpret it as a revision.
 */
$t = split("\\.", $edition);
$tcout = count($t);
$revision = @$t[$tcout-1];

if ($tcout > 1 && preg_match("/\d+/", $revision)) {
    $edition = join(".", array_slice($t, 0, $tcout-1));
    $editionid = @$t[0];
} else {
    $editionid = $edition;
    $revision = "";
}

$gc_extpath = "/releases/gc/install.php?edition=";
$ff_extpath = "/releases/ff/libx2-latest.xpi?edition=";

$edition_with_revision = $edition .  ($revision != "" ? "." . $revision : "");

$edition_config_xml = $editionpath . '/config.xml';
$edition_xpi = $editionpath . '/libx-' . $edition . '.xpi';
$edition_exe = $editionpath . '/libx-' . $edition . '.exe';
$exp_edition_xpi = $editionpath . '/libx2-' . $edition . '.xpi';
$exp_edition_exe = $editionpath . '/libx2-' . $edition . '.exe';
$edition_built = file_exists($edition_xpi);
$edition_exe_built = file_exists($edition_exe);
$islibx2 = file_exists($editiondir . $editionid . ".islibx2");

if (!file_exists($edition_config_xml)) {
 die ("No such edition - check the edition argument; given was edition=" . $edition); 
}

$config = simplexml_load_file($edition_config_xml);
$searchoptions = $config->xpath('/edition/searchoptions/*');

$edition_name = htmlspecialchars($config->name['edition']);
$version = $config['version'];/*$revision == "" ? "Live" : $revision;*/
$_primary_catalog = $config->xpath('/edition/catalogs/*[1]');
$primary_catalog_name = htmlspecialchars(@$_primary_catalog[0]['name']);

function getOption($key) {
    global $config;
    $o = $config->xpath('/edition/options/option[@key="' . $key . '"]');
    return @$o[0]['value'];
}

function getSearchOptionLabel($optvalue) {
    global $searchoptions;
    foreach ($searchoptions as $o) {
        if ($optvalue == $o['value'])
            return $o['label'];
    }
    switch ($optvalue) {
    case 'Y':   return "Keyword";
    case 't':   return "Title";
    case 'a':   return "Author";
    case 'd':   return "Subject";
    case 'jt':   return "Journal Title";
    case 'at':   return "Article Title";
    case 'i':   return "ISBN/ISSN";
    case 'c':   return "Call Number";
    default:
        return "Unknown option " . $optvalue;
    }
}

$icon = $editionpath . '/' . basename(getOption("icon"));
$cueicon = basename(getOption("cueicon"));
if (@$cueicon != "")
    $cueicon = $editionpath . '/' . $cueicon;

?>

