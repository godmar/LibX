<?php

/* post or get*/
$url = ($_POST['url']) ? $_POST['url'] : $_GET['url'];

$content = file_get_contents($url);
// skip response status line, forward headers to client
for($i = 1; $i < count($http_response_header); $i++) {
    header($http_response_header[$i]);
}
echo $content;

?>
