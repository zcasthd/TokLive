<?php

	require_once 'Zend/Json.php';
	
	// this is not complete
	
	$username = 'randytroppmann';
	$follower_url = "http://api.twitter.com/1/statuses/friends/" . $username . ".xml";
	$friends = curl_init(); 
	curl_setopt($friends, CURLOPT_URL, $follower_url);
	curl_setopt($friends, CURLOPT_RETURNTRANSFER, TRUE);
	$twiFriends = curl_exec($friends);
	$response = new SimpleXMLElement($twiFriends);
	
	$usernames = array();
	
	foreach($response->user as $friends){
		$name = $friends->screen_name;
		array_push($usernames, $name);
	}	
	
	echo  Zend_Json::encode($usernames);
?>
