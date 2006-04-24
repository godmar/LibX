<?
    // This file can be included from the top-level editionsintesting.php, but 
    // can also be called directly
    // If called from top-level, $path_prefix is set to /libx/src/editions/
    // This scripts uses the editions.list file in libx/src/editions

    $editions_list = @$path_prefix . "editions.list";   // id,desc list

    if (!file_exists($editions_list))
        die ($editions_list . " cannot be opened, please email libx.org@gmail.com");

    $efile = fopen($editions_list, 'r');
    while (!feof($efile)) {
        $line = fgets($efile, 1024);
        if (preg_match('/^#/', $line) || preg_match('/^\s*$/', $line))
            continue;

        $tmp = explode(',', $line, 2);
        $editions[] = $tmp[0] . "/config";
        $released[$tmp[0]] = $tmp[1];
    }
    fclose($efile);
?>

<table border="0">
<tr>
    <th>Last rebuilt</th>
    <th>Id</th>
    <th>Live</th>
    <th>Edition</th>
    <th>Config File</th>
    <th>Primary Catalog</th>
    <th>OpenURL</th>
    <th>Proxy</th>
</tr>
<?
    include("readconfigfiles.php");

    # sort $CONFIG array by 'lastmod' key, most recent first
    function by_date($a, $b) { 
        return ($b[lastmod] < $a[lastmod]) ? -1 : 1;
    }
    usort ($CONFIG, 'by_date');

    for ($i = 0; $i < count($CONFIG); $i++) {
        echo "<tr>";
        $ec =& $CONFIG[$i];
        $icon = basename($ec['emiconURL']);
        echo "<td>" . date('Y/m/d', $ec[lastmod]) . "</td>"
            . "<td>" . $ec[name] . "</td>"
            . "<td>" 
                . ($released[$ec[name]] == 1 ? '<img src="/images/greencheck.gif" />' : "") 
            . "</td>"
            . '<td>'
            . '<img width="16" height="16" src="' . @$path_prefix . $ec[name] . "/" . $icon . '" />'
            . ' <a target="_top" 
                   href="' . @$path_prefix .  'libxtestedition.php?edition=' . $ec[name] . '">' 
            . ereg_replace("Edition$", "", $ec['libxedition'])
            . '</a></td>'
            . '<td><a href="' . @$path_prefix . $ec[name] . '/config">config</a></td>'
            . "<td>" . $ec['$catalog.type'] . "</td>"
            . "<td>" . $ec['openurltype'] . "</td>"
            . "<td>" . $ec['proxytype'] . "</td>"
            . '</b>';
        echo "</tr>\n";
    }
?>
</table>
