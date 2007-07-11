<?
/*
 * Read a config.xml file.
 */

$edition = @$_GET['edition'];
$libxbase = "/libx/src/base";

// edition ids must be all alphanumerical.
if (!preg_match("/^[a-zA-Z0-9\.]+$/", $edition)) die ("Wrong argument.");
if ($edition{0} >= 'a' && $edition{0} <= 'z') {
    $editionpath = $edition;
} else {
    $editionpath = substr($edition, 0, 2) . "/" . substr($edition, 2, 2) . "/" . $edition;
}

$t = split("\\.", $edition);
$edition = $t[0];
$revision = @$t[1];
$edition_config_xml = $editionpath . '/config.xml';
$edition_xpi = $editionpath . '/libx-' . $edition . '.xpi';
$edition_built = file_exists($edition_xpi);

if (!file_exists($edition_config_xml)) {
    die ("No such edition - check the edition argument; given was edition=" . $edition);
}

$config = simplexml_load_file($edition_config_xml);
$searchoptions = $config->xpath('/edition/searchoptions/*');

$edition_name = $config->name['edition'];
$version = $config['version'];

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
?>

