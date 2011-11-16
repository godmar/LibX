<?php

/* post or get*/
$url = ($_POST['url']) ? $_POST['url'] : $_GET['url'];

header ("Content-Type:text/xml");
echo file_get_contents($url);

?>
