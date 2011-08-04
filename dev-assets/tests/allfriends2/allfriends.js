$(document).ready(initialize);
var twitterFriends;
var friendScreenNames;
//// Twitter
var twitterConnectButton;
var isConnectedToTwitter = false;
var currentTwitterUser;
var currentTwitterScreenName;
var lsoShim;






/*
<span id="twitter-connect-placeholder"></span>
<script type="text/javascript">

  twttr.anywhere(function (T) {

    var currentUser,
        screenName,
        profileImage,
        profileImageTag;

    if (T.isConnected()) {
      currentUser = T.currentUser;
      screenName = currentUser.data('screen_name');
      profileImage = currentUser.data('profile_image_url');
      profileImageTag = "<img src='" + profileImage + "'/>";
      $('#twitter-connect-placeholder').append("Logged in as " + profileImageTag + " " + screenName);
    } else {
      T("#twitter-connect-placeholder").connectButton();
    };

  });

</script>
*/





function initialize() {
	$('.log').ajaxError(function(e, xhr, settings, exception) {
		$(this).append('<p>' + e.type + ', status : ' + xhr.status + ' ' + xhr.statusText + '</p>');
	});
	lsoShim = thisMovie("ProgressIndicator");
	twitterConnectButton = $("#twitterConnectButton").get(0);
	initializeTwitter();
}

function thisMovie(movieName) {
     if (navigator.appName.indexOf("Microsoft") != -1) {
         return window[movieName];
     } else {
         return document[movieName];
         alert(document[movieName]);
     }
}


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
	    	if (friendScreenNames.length > 0) parseFriendsFromLSO(friendScreenNames);
	    	else searchForTwitterFriends();
	    });
	
	    T.bind("signOut", function (e) {
			isConnectedToTwitter = false;
			twitterConnectButton.innerHTML = "connect with twitter";
	    	$('.log').append("<p>disconnected from twitter</p>");
	    	$("#friendsList").empty();
	    });			    
  	});
}













function searchForTwitterFriends(){
   	$("#friendsList").empty();
	friendScreenNames = new Array();
	getFriends(-1);
	/*
var urlTwitter = "http://api.twitter.com/1/users/show/" + currentTwitterScreenName + ".json";
	$.ajax({url:urlTwitter
					,data:{}
					,contentType: "application/jsonp; charset=utf-8"
					,success:handleTwitterUserDetails
					,dataType:'jsonp'
					,cache:true
					,error:ajaxErrorHandler
            		});
	$('.log').append("<p>getting user info</p>");
*/
}


var ajaxErrorHandler = function(message){
	$('.log').append("<p>AJAX error</p>");
}

/*
var handleTwitterUserDetails = function(data){
	$('.log').append("<p>" + currentTwitterScreenName + " Friend count: " + data.friends_count + "</p>");
	getFriends(-1);
}
*/

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







// FLASH LSO SHIM METHODS

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


