<?
    /* This file is supposed to be included
    it assumes that $path_prefix is set, and that $editions[] contains
    an array of config files, relative to $path_prefix.
    It reads the config files, and populates an $CONFIG array
    $CONFIG[#number][keyused_in_config] contains the config file values

    Replaces the $editions array entries with their ids, i.e.,
    it changes "vt/config" into "vt"
    */
    define("name", '_name');
    define("lastmod", '_lastmod');

    for ($i = 0; $i < count($editions); $i++) {
        $filename = @$path_prefix . $editions[$i];
        $tmp = explode('/', $editions[$i]);
        if (!file_exists($filename)) {
            $CONFIG[$i]['libxname'] = "No such edition";
            break;
        }
            
        $f = fopen($filename, 'r');
        $editions[$i] = $tmp[count($tmp)-2];    // change "vt/config" to "vt"

        // read config file
        while (!feof($f)) {
            $line = fgets($f, 1024);
            if (preg_match('/^#/', $line) || preg_match('/^\s*$/', $line))
                continue;
            $kv = explode("=", $line, 2);
            $CONFIG[$i][$kv[0]] = rtrim($kv[1]);
        }
        $CONFIG[$i][lastmod] = filemtime(@$path_prefix . $editions[$i] 
                                        . '/libx-' . $editions[$i] . '.xpi');
        $CONFIG[$i][name] = $editions[$i];
    }
?>
