<?php
// post or get
$url = ($_POST['url']) ? $_POST['url'] : $_GET['url'];

header ("Content-Type:text/xml");
echo file_get_contents($url);
/*try
{
	$session = curl_init($url);

	curl_setopt($session, CURLOPT_HEADER, true);
	curl_setopt($session, CURLOPT_RETURNTRANSFER, true);

	// Make the call
	$doc = curl_exec($session);
	if(empty($doc))
		echo 'nothing was returned';
	else
		echo $doc;

	
	curl_close($session);

}
catch(Exception $e)
{
	echo 'Err in proxy: ' .$e->getMessage();
}
*/
?>
