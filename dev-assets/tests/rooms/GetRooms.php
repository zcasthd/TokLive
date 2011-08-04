<?php
	
	require_once 'Zend/Json.php';

	

	$room1 = array ("chrismcleodAU", "andrewdudum", "sally","matt_legrand", "danaditomaso", "tony", "fredt", "arnie_the_man", "meg_morrison_");
	$room2 = array ("Seantron", "jackmintz", "jonny", "alain", "samantha", "phillip", "renaun", "rushtheband", "donny_osmand", "Danny");
	$room3 = array ("sean", "followlolo", "creativeandlive", "joshuagates", "Robert", "Steven", "Jeff", "SethMacFarlane");
	$room4 = array ("KrisWilliams81", "mchou", "melanienathan", "togaranko", "universalmind", "alexfrance", "robinhilliard", "Sammy_hagar");
	$room5 = array ("alex_lifeson","terrypaton1", "Wayne_gretzky", "YEGgirlgeek", "mschireson");
	$rooms = array ($room1, $room2, $room3, $room4, $room5);
	
	
	echo  Zend_Json::encode(array($room1, $room2, $room3, $room4, $room5));
	
?>














