<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 3.2//EN">
<html>
<head>
<title>LibX 2.0 Translation Checker</title>
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
<style>
body {
    font-family: Verdana, Arial, sans-serif;
}

tr:nth-child(odd)       { background-color:#eee; }
tr:nth-child(even)      { background-color:#fff; }

</style>
</head>
<body>
<?php
/*
 * Yet another ad-hoc PhP script.
 * @author Godmar Back, Feb 2012.
 */
$localedir = "locale/";
$locales = array();
foreach (glob($localedir . "*") as $l) {
    $locales[] = basename($l);
}
?>
Please select a translation to check:
    <select id="chooselocale">
    <option value="">Select ...</option>
<?
    foreach ($locales as $b) {
        echo '<option value="' . $b . '">' . $b . '</option>';
    }
?>
    </select>
    <script>
    $(function () {
        var $c = $('#chooselocale');
        $c.change(function () {
            if (document.location.search == "") {
                document.location += '?locale=' + $c.val();
            } else {
                document.location = String(document.location).replace(document.location.search, '?locale=' + $c.val());
            }
        });
    });
    </script>
<?
if (isset($_GET['locale'])) {
    $enUSMsg = json_decode(file_get_contents($localedir . "en_US/messages.json"));
    $locale = $_GET['locale'];
    if (!in_array($locale, $locales)) {
        echo "Bad locale";
        exit;
    }
    $lRaw = file_get_contents($localedir . $locale . "/messages.json");
    // echo $lRaw;
    $lMsg = json_decode($lRaw);
    echo '<table>';
    echo '<tr><th>Label</th><th>en_US</th><th>' . $locale . '</th></tr>';
    foreach ($enUSMsg as $enUSlabel => $enUSobj) {
        echo '<tr><td width="20%">';
        echo $enUSlabel; 
        echo '</td><td width="40%">';
        echo $enUSobj->message;
        echo '</td><td width="40%">';
        if (isset($lMsg->$enUSlabel)) {
            echo $lMsg->$enUSlabel->message;
        } else {
            echo '<font color="red">MISSING</font>';
        }
        echo '</td></tr>';
    }
    echo '</table>';
    echo '<h3>Unused labels (no longer in enUS)</h3>';
    echo '<table>';
    foreach ($lMsg as $lLabel => $lObj) {
        if (!isset($enUSMsg->$lLabel)) {
            echo '<tr>';
            echo '<td>' . $lLabel . '</td>';
            echo '<td>' . json_encode($lObj) . '</td>';
            echo '</tr>';
        }
    }
    echo '</table>';
?>

<?
}
?>
</body>
</html>
