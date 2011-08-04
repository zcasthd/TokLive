$(document).ready(initialize);
var twitterFriends;
var friendScreenNames;
//// Twitter
var twitterConnectButton;
var isConnectedToTwitter = false;
var currentTwitterUser;
var currentTwitterScreenName;
var lsoShim;
var tokLiveRooms; //array of json data returned from ajax call for active rooms
var currentRoomIndex = 0;

/*
	bootstrap async processes
	1) load tok live rooms
	2) connect to twitter on user click
	3) on connect success, fetch friends based on user names:
		- check LSO first
		- if LSO empty, use twitter API
	4) highlight twitter friends in participants list
*/



function initialize() {
	$('.log').ajaxError(function(e, xhr, settings, exception) {
		$(this).append('<p>' + e.type + ', status : ' + xhr.status + ' ' + xhr.statusText + '</p>');
	});
	lsoShim = thisMovie("ProgressIndicator");
	twitterConnectButton = $("#twitterConnectButton").get(0);
	initializeTwitter();
	loadTokLiveRooms();
}



function thisMovie(movieName) {
     if (navigator.appName.indexOf("Microsoft") != -1) {
         return window[movieName];
     } else {
         return document[movieName];
         alert(document[movieName]);
     }
}




/*******
********	ROOMS LIST METHODS
********/
function handleRoomClick(item){
	currentRoomIndex = (item.id.substr(11));
	setRoomParticipantsList(currentRoomIndex);
}



function loadTokLiveRooms(){
	$.ajax({url:"./GetRooms.php"
					,data:{}
					,success:handleTokLiveRoomsData
					,dataType:"json"
					,cache:true});
}
function handleTokLiveRoomsData(p_data){
	currentRoomIndex = 0
	tokLiveRooms = p_data;
	var len = p_data.length;
	var myList = $('#tokLiveRoomsList');
	myList.empty();
	var roomsHTML = "";
	for (var i=0; i<len; i++){
		myList.append("<li onclick='handleRoomClick(this)' id='tokliveroom" + i + "'>Room " + i + "</li>");
	}
	setRoomParticipantsList(currentRoomIndex);
}
function setRoomParticipantsList(p_index){
	var people = tokLiveRooms[p_index];
	var len = people.length;
	var myDiv = $('#roomParticipants');
	myDiv.empty();
	myDiv.append('<p class="title">' + len + ' Participants <span class="friend">(friends)</span></p>');
	for (var i=0; i<len; i++){
		var myClass = isTwitterfriend(people[i])?"friend":"no";
		myDiv.append('<p class=' + myClass + '>' + people[i] + '</p>');
	}
}
function isTwitterfriend(p_screen_name){
	if (friendScreenNames){
		var len = friendScreenNames.length;
		for (var i=0; i<len; i++){
			//console.log([friendScreenNames, p_screen_name, friendScreenNames == p_screen_name])
			if (friendScreenNames[i] == p_screen_name) return true;
		}
	}
	return false;
}











/*******
********	TWITTER METHODS
********/

function handleTwitterConnectButton(){
	if (isConnectedToTwitter){
		twttr.anywhere.signOut();
	}
	else{ 
		twttr.anywhere(function (T) { T.signIn();});
	}	
}

function initializeTwitter(){
	twttr.anywhere(function (T) {				
	    T.bind("authComplete", function (e, user) {
	    	currentUser = T.currentUser;
	    	currentTwitterScreenName = currentUser.data('screen_name');
			isConnectedToTwitter = true;
	    	twitterConnectButton.innerHTML = "sign out of twitter";
	    	$('.log').append("<p>connected to twitter: " +  currentTwitterScreenName + "</p>");
			retrieveFriendsFromLSO();	    	
	    	if (friendScreenNames.length > 0){
	    		parseFriendsFromLSO(friendScreenNames);
	    		setRoomParticipantsList(currentRoomIndex);
	    	}
	    	else{
	    		searchForTwitterFriends();
	    	}
	    });
	
	    T.bind("signOut", function (e) {
			isConnectedToTwitter = false;
			twitterConnectButton.innerHTML = "connect with twitter";
	    	$('.log').append("<p>disconnected from twitter</p>");
	    	friendScreenNames = {};
	    	setRoomParticipantsList(currentRoomIndex);
	    });			    
  	});
}

function searchForTwitterFriends(){
   	$("#friendsList").empty();
	friendScreenNames = new Array();
	getFriends(-1);
}


var ajaxErrorHandler = function(message){
	$('.log').append("<p>AJAX error</p>");
}

function getFriends(cursor){
	thisMovie("ProgressIndicator").jsShowAnimation();
	if (cursor == undefined) cursor = -1;
	var urlFriends = "http://twitter.com/statuses/friends.json";
	$.ajax({url:urlFriends
					,data:{screen_name:currentTwitterScreenName,cursor:cursor}
					,success:handleTwitterFriends
					,dataType:"jsonp"
					,cache:true});
	console.log("friend list request sent");
	$('.log').append("<p>getting friends list</p>");
}

var handleTwitterFriends = function(data){
	parseFriends(data.users);
	if (data.next_cursor) getFriends(data.next_cursor);	
	else{
		saveFriendsToLSO();
		$('.log').append("<p>Query complete. Found " + friendScreenNames.length + " friends.</p>");
		thisMovie("ProgressIndicator").jsHideAnimation();
		setRoomParticipantsList(currentRoomIndex);
	} 	
}

function parseFriends(friends){
	var len = friends.length;
	for (var i=0; i<len; i++){
		friendScreenNames.push(friends[i].screen_name);
		$("#friendsList").append('<p>' + friends.length + ") " + friends[i].screen_name + '</p>');
	}	
}

function parseFriendsFromLSO(p_friends){
	var len = p_friends.length;
	for (var i=0; i<len; i++){
		$("#friendsList").append('<p>' + i + ") " + p_friends[i] + '</p>');
	}	
	$('.log').append("<p>" +  p_friends.length + " friends loaded from Local Shared Object</p>");
}




/*******
********	FLASH LSO SHIM METHODS
********/

function confirmClear(message){
	$('.log').append("<p>lso shim: " +  message + "</p>");
}
function saveFriendsToLSO(){
	thisMovie("ProgressIndicator").jsSetFriends(friendScreenNames, currentTwitterScreenName);
}
function retrieveFriendsFromLSO(){
	var lsoObj = thisMovie("ProgressIndicator").jsGetFriends();
	$('.log').append("<p>Local Shared Object: username: " + lsoObj.username + ", friends:  " + lsoObj.friends.length + "</p>");
	if (lsoObj.username == currentTwitterScreenName){
		friendScreenNames = lsoObj.friends;
	}
	else{
		friendScreenNames = [];
	}
	
}


