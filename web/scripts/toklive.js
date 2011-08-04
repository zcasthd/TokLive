var thePartnerKey = 1127;			// partner key for OpenTok API
var maxParticipants = 10;			// max participants 
var theSessionId; 					// TokBox SessionID: determines what room you are in
var myInitialSessionID;
var startNewSessionAfterDestroy = false;
var currentSessionName = "0";		// Session name is assigned serverside
var isDeepLinked = false;			// deep linked if session ID is passed in a query string property called "id"
var userNames = new Array();		// asscoiative array: key is connectionId
var sessionToken = "";				// used for TokBox session.connect
var theSession = null;				// TokBox session object
var isSessionConnected = false;
var thePublisher = null;			// TokBox publisher object
var myConnectionId;					// TokBox generated connection ID for browser instance
var myStreamContainerObj;
var participants = 0;				// Number of paticipants in the call
var watchers = 0;					// Number of users watching but not participating
var debug = false; 					// ToxBox event alerting
var isPublishing = false;			// Is browser instance publishing video stream through 
var isViewingOnly = false;			// It is possible to watch other tokbox publishers in a room without publishing yourself
var wantsToParticipate = true;		// Helper for the async connection process
var PUBLISHER_WIDTH = 160;			// video widget dimension
var PUBLISHER_HEIGHT = 120;			// 
var SUBSCRIBER_WIDTH = 160;			// 
var SUBSCRIBER_HEIGHT = 120;		// 
var roomURLInput;					// reference to the input control holding the room URL
var copyToClipBoardSWF;				// reference to swf helper used to copy URL to clipboard
var isLoadingRoomsData = false;
//// TOKBOX STREAM CONTAINER POOL 
var	activeStreamContainers = new Array();//associative array with connectionId as the key
var availableStreamContainers = new Array();
var localUserStreamContainerObj;
//// TOKLIVE SPECIFIC
var isPanelTwoOpen = false; 
var isPanelThreeOpen = false;
var friendScreenNames = [];
var lsoShim; //reference to flash object that caches the twitter friends
var tokLiveRooms = []; //array of json data returned from ajax call for active rooms
var currentRoomIndex = 0;
//// TWITTER-RELATED PROPS
var twitterFriends;
var twitterConnectButton;
var isConnectedToTwitter = false;
var currentTwitterScreenName = "not connected";
//// TWITTER stream widget props
var displayedTweets = [];
var cachedNewTweets = [];
var hasFirstTweets = false;
var isTweetStreamStarted = false;
//// Begin other initilization when jquery says everything is ready
$(document).ready(initialize);

var testInitData;



/***************************
  INITIALIZE METHODS
***************************/
function initialize(){	
	//// HANDLE page unload
	$(window).unload(function(){ 
			if (isPublishing) jQuery.ajax({url:"app/index.php/participant/leave/" + theSessionId + "/" + currentTwitterScreenName, async:false});
			else if (isSessionConnected) jQuery.ajax({url:"app/index.php/viewer/leave/" + theSessionId + "/" + currentTwitterScreenName, async:false});
		
		});
	//// INITIALIZE slide out panels
	$("#panelHeaderTwo").click(function(){ togglePanelContentTwoDisplay() });
	
	//// SET LOGO	
	if (tokliveParams.logoURL) {
		$('#titleContainer').html('<img src=' + tokliveParams.logoURL + ' border="0">');
	}									
	
	//// INITIALIZE clipboad copy swf
	swfobject.embedSWF("scripts/copytoclipboard.swf", "copyToClipboardSWF", "42", "30", "10.0.0", "expressInstall.swf", null, {menu: "false", allowscriptaccess:"always", wmode:"transparent"}, {id:"copyToSWF"});
	
	//// GET references to some UI items
	lsoShim = thisMovie("lsoShim");
	twitterConnectButton = $("#twitterConnectButton").get(0);
	
	//// CONNNECT TO TWITTER button is disabled until twitter api initializes
	$("#twitterConnectButton").attr("disabled", "disabled");
	
	//// INITIALIZE the stream container pool
	initializeStreamContainers();
	
	//// TEST to see if this page is deep-linked
	if (getQueryVariable("id")){		
		theSessionId = getQueryVariable("id");
		isDeepLinked = true;
	}
	
	//// CALL various initialization methods
	fetchTokBoxToken(false);
	initializeTwitter();
	
	if (tokliveParams.isDebugMode) setInterval(debugUpdate, 1000);	
	setInterval(loadTokLiveRooms, 45000);
	
}

function debugUpdate(){
	$("#debugPanel").css("display", "block");
	$("#debugPanel").empty();
	$("#debugPanel").append("theSessionId: " + theSessionId + "<br>");
	$("#debugPanel").append("isConnectedToTwitter: " + isConnectedToTwitter + "<br>");
	$("#debugPanel").append("theSession: " + theSession + "<br>");
	$("#debugPanel").append("isSessionConnected: " + isSessionConnected + "<br>");
	$("#debugPanel").append("isPublishing: " + isPublishing + "<br>");
	$("#debugPanel").append("isViewingOnly: " + isViewingOnly + "<br>");
	$("#debugPanel").append("wantsToParticipate: " + wantsToParticipate + "<br>");
	$("#debugPanel").append("localUserStreamContainerObj: " + localUserStreamContainerObj + "<br>");
	$("#debugPanel").append("friendScreenNames: " + friendScreenNames.length + "<br>");
	$("#debugPanel").append("isPanelTwoOpen: " + isPanelTwoOpen + "<br>");
	
}





/***************************
 GUI BUTTON event handlers
***************************/
function handleTwitterConnectButton(){
	if (isConnectedToTwitter){
		twttr.anywhere.signOut();
		stopPublishing();
		if (isPanelTwoOpen) togglePanelContentTwoDisplay();
	}
	else{ 
		twttr.anywhere(function (T) { T.signIn();});
	}	
}

function handleStartNewSessionClick(){	
	currentSessionName = "";
	//// this button toggles from "start a new session" to "exit session"

	if (isConnectedToTwitter && !isPublishing) {		
		if (isSessionConnected){
			theSessionId = myInitialSessionID;
			startNewSessionAfterDestroy = true;
			destroyTokBoxSession();
		} 
		else{
			theSessionId = myInitialSessionID;
			initializeTokBoxSession();
		} 
		$("#newTokboxSessionButton").html("Starting ...");
	}
	else{
		destroyTokBoxSession();
	}
	
		
}

function handlePanelTwoParticipateButtonClick(){
	if (isSessionConnected && !isPublishing) startPublishing();
	else destroyTokBoxSession();
}

function handlePanelThreeParticipateButtonClick(){
	var state = $("#panelThreeHeaderParticipateButton").text();
	if (state == "Participate"){
		if (isSessionConnected){
			startPublishing();
		}
		else{
			initializeTokBoxSession();
		}
	} 
	else if (state == "View") {
		stopPublishing();
	}
}

function handlePanelThreeExitButtonClick(){
	destroyTokBoxSession();
	if (!isPanelTwoOpen) togglePanelContentTwoDisplay();
}



function onTweetButtonClick(){
	window.open('http://twitter.com/share?url=' + tokliveParams.baseURL + '?id=' + theSessionId + '&via=tokbox&count=none&text=Come%20and%20join%20the%20conversation!');
}

function handleTwitterSignOut(){
	if (isConnectedToTwitter){
		twttr.anywhere.signOut();
		stopPublishing();
	}
}

//// these two buttons are in the panel 2 sessions list
function viewButtonClick(button){
	if (isConnectedToTwitter){
		currentSessionName = button.name.substr(11);
		wantsToParticipate = false;
		if (isPublishing && theSessionId == button.id.substr(10)) {
			stopPublishing();
		}
		else if (!isSessionConnected){
			theSessionId = button.id.substr(10);
			initializeTokBoxSession();
		}
		else{
			startNewSessionAfterDestroy = true;
			destroyTokBoxSession();
			theSessionId = button.id.substr(10);
			//initializeTokBoxSession();
		}		
		
		togglePanelContentTwoDisplay();
	}
}
function participateButtonClick(button){
	if (isConnectedToTwitter){
		wantsToParticipate = true;
		if (isPublishing) stopPublishing();
		currentSessionName = button.name.substr(11);
		//logMessage([isSessionConnected,theSessionId,button.id.substr(17)]);
		if (!isSessionConnected){
			theSessionId = button.id.substr(17);
			initializeTokBoxSession();
		}
		else if ((isSessionConnected && theSessionId != button.id.substr(17))){
			//need to load new session;
			startNewSessionAfterDestroy = true;
			destroyTokBoxSession();
			theSessionId = button.id.substr(17);
			//initializeTokBoxSession();
		}
		else{
			//need to join existing session
			startPublishing();			
		}
	}
}













/******************************
 PANEL TWO ACTIVE ROOMS METHODS
*******************************/
/*
function handleRoomRowOver(item){
	currentRoomIndex = (item.id.substr(7));
	resetRows();
	$('#roomParticipants').css("display", "block");
	$('#newSessionButtonHolder').css("display", "none");
	$('#arrowCell' + currentRoomIndex).css("background-image", "url(images/arrow-selected-row.png)");
	setRoomParticipantsList(currentRoomIndex);
}
function resetRows(){
	var len = tokLiveRooms.length;
	for (var i=0; i<len; i++){
		 $('#arrowCell' + i).css("background-image", "url(images/arrow-right-blue.png)");
	}
	$('#roomParticipants').css("display", "none");
	$('#newSessionButtonHolder').css("display", "block");
}
*/


function loadTokLiveRooms(){
	//logMessage("loading rooms");
	if (!isLoadingRoomsData){
		isLoadingRoomsData = true; 
		$.ajax({url:"app/index.php/session/all/"
						,data:{}
						,success:handleTokLiveRoomsData
						,dataType:"json"
						,cache:true});
	}
}
function handleTokLiveRoomsData(p_data){
	// sample data{"sessions":[{"opentokID":"OT2345","name":"8","participants":["cschlegelmilch","tanyacamp"],"viewers":[]},{"opentokID":"OT2346","name":"3","participants":["bill"],"viewers":["elsa"]},{"opentokID":"OT0987","name":"5","participants":[],"viewers":[]}]}
	/*
		{	"opentokID":"OT2345",
			"name":"8",
			"participants":["cschlegelmilch","tanyacamp"],
			"viewers":[]
		}
	*/	
	isLoadingRoomsData = false;
	$('#roomsList').empty();
	currentRoomIndex = 0;
	var previousQuant = 0;
	tokLiveRooms = p_data.sessions;
	var len = tokLiveRooms.length;
	var roomsList = $('#roomsList');
	var roomsTable = "<table id='roomsTable' ><thead><tr><th>session</th><th>&nbsp;</th><th>&nbsp;</th><th>friends</th><th>viewers</th><th>participants</th><th>&nbsp;</th></tr></thead><tbody>"; 
	roomsTable += "</tbody></table'>";
	roomsList.append(roomsTable);
	var roomsRow = "";
	var rows = [];
	var twitterFriendsCount = 0;
	var len2, j;
	for (var i=0; i<len; i++){
		twitterFriendsCount = twitterFriendsQuant(tokLiveRooms[i].participants);
		roomsRow = new String();
		roomsRow = "<tr id='roomRow" + i + "'>"
		roomsRow += ("<td>" + tokLiveRooms[i].name + "</td>");
		roomsRow += ("<td class='viewButtonCell'><button name='viewSession" + tokLiveRooms[i].name + "' class='roomViewButton' id='viewButton" + tokLiveRooms[i].opentokID + "' onClick='viewButtonClick(this)'>View</button></td>");
		roomsRow += ("<td class='participateButtonCell'><button  name='partSession" + tokLiveRooms[i].name + "' class='roomParticipateButton' id='participateButton" + tokLiveRooms[i].opentokID + "' onClick='participateButtonClick(this)'>Participate</button></td>");
		roomsRow += ("<td class='friendsCell'>" + twitterFriendsCount + "</td>");
		roomsRow += ("<td class='viewersCell' id='viewersCell'>" + tokLiveRooms[i].viewers.length + "</td>");
		roomsRow += ("<td class='viewersCell' id='participantsCell'>" + tokLiveRooms[i].participants.length + "</td>");
		roomsRow += ("<td class='twitterFriendsCell' id='twitterFriendsCell" + i + "'>");
			// add twitter icons to this cell		
			len2 = tokLiveRooms[i].participants.length;
			for (j=0; j<len2; j++){
				roomsRow += "<div class='participantsTwitterIcon' onmouseover='handleParticipantIconMouseOver(this)' onmouseout='handleParticipantIconMouseOut(this)'>"
				roomsRow += 	"<div><img src='http://api.twitter.com/1/users/profile_image/" + tokLiveRooms[i].participants[j] + ".json?size=mini' width='24' height='24' border='0'>"
				roomsRow += 	"<div class='participantsTwitterIconRollover'>" + tokLiveRooms[i].participants[j]  + "</div></div>"
				roomsRow += "</div>"
			}		
		roomsRow += ("</td>");
		roomsRow += "</tr>";
		rows.push ({quant:twitterFriendsCount,html:roomsRow});
	}
	//// SORT the rows on the number of twitter friends
	rows.sort(function(a,b){return b.quant - a.quant});
	for (i=0; i<len; i++){
		$('#roomsTable').append(rows[i].html);
	}	
	//setRoomParticipantsList(currentRoomIndex);
}

function handleParticipantIconMouseOver(p_item){
	var rollover = $(p_item).find(".participantsTwitterIconRollover");
	rollover.css("display", "block");
}

function handleParticipantIconMouseOut(p_item){
	var rollover = $(p_item).find(".participantsTwitterIconRollover");
	rollover.css("display", "none");
}


/*
function setRoomParticipantsList(p_index){
	if (tokLiveRooms.length > 0){
		var people = tokLiveRooms[p_index].participants;
		var len = people.length;
		var myDiv = $('#roomParticipants');
		myDiv.empty();
		var divLeft = "<div class='participantsLeft'>";
		var divRight = "<div class='participantsRight'>";
		myDiv.append('<p class="title">' + len + ' &nbsp;&nbsp;PARTICIPANTS</p>');
		for (var i=0; i<len; i++){
			var myClass = isTwitterfriend(people[i])?"friend":"no";
			if (i<5) divLeft += '<p class=' + myClass + '>' + people[i] + '</p>';
			else divRight += '<p class=' + myClass + '>' + people[i] + '</p>';
		}
		if (len > 5) myDiv.append(divRight + "</div>");
		myDiv.append(divLeft + "</div>");
	}
}
*/
function isTwitterfriend(p_screen_name){
	if (friendScreenNames){
		var len = friendScreenNames.length;
		for (var i=0; i<len; i++){
			//logMessage([friendScreenNames, p_screen_name, friendScreenNames == p_screen_name])
			if (friendScreenNames[i] == p_screen_name) return true;
		}
	}
	return false;
}
function twitterFriendsQuant(people){
	var len = people.length;
	var quant = 0;
	for (var i=0; i<len; i++){
		//logMessage("twitterFriendsQuant: " + [people[i], isTwitterfriend(people[i])]);
		if (isTwitterfriend(people[i])) quant++;
	}
	return quant;
}



function initializeFromDeepLink(){
	wantsToParticipate = false;
	initializeTokBoxSession();
}



function tellTokLiveDBParticipantJoined(){
	logMessage("SENDING: tellTokLiveDBParticipantJoined");
	$.ajax({url:"app/index.php/participant/join/" + theSessionId + "/" + currentTwitterScreenName
					,data:{}
					,success:function(data){
						logMessage("RESPONSE: tellTokLiveDBParticipantJoined: " + [data.status, data.message, data.sessionName]);
							if (data.sessionName){
								currentSessionName = data.sessionName;
								setPanelTwoHeaderText();
							}
						}
					,dataType:"json"
					,cache:true});

}
function tellTokLiveDBParticipantLeaving(){
	logMessage("SENDING: tellTokLiveDBParticipantLeaving");
	$.ajax({url:"app/index.php/participant/leave/" + theSessionId + "/" + currentTwitterScreenName
					,data:{}
					,success:function(data){
						logMessage("RESPONSE: tellTokLiveDBParticipantLeaving: "  + [data.status, data.message]);
						}
					,dataType:"json"
					,cache:true});
}

function tellTokLiveDBViewerJoined(){
	if (wantsToParticipate)return; //// bail because this user is signing on as a participant
	logMessage("SENDING: tellTokLiveDBViewerJoined");
	$.ajax({url:"app/index.php/viewer/join/" + theSessionId + "/" + currentTwitterScreenName
					,data:{}
					,success:function(data){
							logMessage("RESPONSE: tellTokLiveDBViewerJoined: "  + [data.status, data.message, data.sessionName]);
							if (data.sessionName){
								currentSessionName = data.sessionName;
								setPanelTwoHeaderText();
							}
						}
					,dataType:"json"
					,cache:true});
}

function tellTokLiveDBViewerLeaving(){
	if (wantsToParticipate)return; //// bail because this user is signing on as a participant
	logMessage("SENDING: tellTokLiveDBViewerLeaving");
	$.ajax({url:"app/index.php/viewer/leave/" + theSessionId + "/" + currentTwitterScreenName
					,data:{}
					,success:function(data){
						logMessage("RESPONSE: tellTokLiveDBViewerLeaving: " + [data.status, data.message]);
						}
					,dataType:"json"
					,cache:true});
}










/***************************
 TWITTER API METHODS
***************************/
function initializeTwitter(){
	$("#twitterConnectButton").removeAttr("disabled");
	$("#twitterConnectButton").html("Connect with Twitter");
	twttr.anywhere(function (T) {				
	    T.bind("authComplete", function (e, user) {
	    	//// TWITTER AUTHERIZATION WAS SUCCESSFUL
	    	currentUser = T.currentUser;
	    	currentTwitterScreenName = currentUser.data('screen_name');
			isConnectedToTwitter = true;
	    	twitterConnectButton.innerHTML = "sign out of twitter";
	    	//logMessage("connected to twitter: " +  currentTwitterScreenName );
			retrieveFriendsFromLSO();	
			loadLiveStream(); 
			$("#panelOneHeaderText").html("SIGN IN Signed in as @" + currentTwitterScreenName);
			if (!isDeepLinked) togglePanelContentTwoDisplay(); //opens panel
			$("#twitterShareControls").fadeIn("fast");
			loadTokLiveRooms();
			if (isDeepLinked){ 
				initializeFromDeepLink();
				isDeepLinked = false;
			}
	    	if (friendScreenNames.length > 0){
	    		parseFriendsFromLSO(friendScreenNames);
	    		/* setRoomParticipantsList(currentRoomIndex); */
	    	}
	    	else{
	    		searchForTwitterFriends();
	    	}
	    });	
	    T.bind("signOut", function (e) {
	    	//// TWITTER AUTHERIZATION TERMINATED
			isConnectedToTwitter = false;
			twitterConnectButton.innerHTML = "connect with twitter";
	    	//logMessage("disconnected from twitter");
	    	friendScreenNames = {};
	    	/* setRoomParticipantsList(currentRoomIndex); */
	    	//$("#panelContentThree").slideToggle("fast");
			//$("#panelContentThree").css("display", "none");
			$("#twitterShareControls").fadeOut("fast");
			$("#panelOneHeaderText").html("SIGN IN with your Twitter account.");
	    });			    
  	});
}


function searchForTwitterFriends(){
   	$("#friendsList").empty();
	friendScreenNames = new Array();
	getFriends(-1);
}

var ajaxErrorHandler = function(message){
	logMessage("AJAX error");
}

function getFriends(cursor){
	if (cursor == undefined) cursor = -1;
	var urlFriends = "http://api.twitter.com/1/statuses/friends.json";
	$.ajax({url:urlFriends
					,data:{screen_name:currentTwitterScreenName,cursor:cursor}
					,success:handleTwitterFriends
					,dataType:"jsonp"
					,cache:true});
	logMessage("getting friends list from Twitter");
}

var handleTwitterFriends = function(data){
	parseFriends(data.users);
	if (data.next_cursor) getFriends(data.next_cursor);	
	else{
		//// gathering twitter friends list is complete
		saveFriendsToLSO();
		loadTokLiveRooms();
		lsoShim.jsHideAnimation();
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
}









/******************************
 TWITTER STREAM WIDGET METHODS
******************************/
function getTweets(){
	var term = tokliveParams.twitterTerms;
	$.ajax({url:"http://search.twitter.com/search.json"
					,data:{q:term}
					,success:handleTweets
					,dataType:"jsonp"
					,cache:true});					
}

function handleTweets(data){
	var tweets = data.results;
	var newTweetCount = 0; //// for testing
	var len = tweets.length;
	cachedNewTweets = [];
	for (var i=len-1; i>=0; i--){
		var tweet = tweets[i];
		if (!displayedTweets[tweet.id_str]){
			var imageDiv = "<div class='tweetAvatar'><img src='" + tweet.profile_image_url + "'></div>";
			var usenameDiv = "<div><span class='twitterUsername'><a href='http://www.twitter.com/"+ tweets[i].from_user+"/' target='_blank'>" + tweets[i].from_user  + "</a></span><div class='tweetDate' id='tweetDate" + tweet.id_str + "'>(" + prettyDate(tweets[i].created_at) + ")</div></div>";
			var tweetContent = tweets[i].text.replace(/(http:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>');
			var tweetDiv = "<div>" + usenameDiv + tweetContent + "</div>";
			var divString = "<div class='tweetContainer' id='" + tweet.id_str + "' style='display:none'>" + imageDiv + tweetDiv + "</div>";			
			if (!hasFirstTweets && i > 5) setTweet(divString, tweet.id_str, tweets[i].created_at);
			else cachedNewTweets.push({div:divString, id:tweet.id_str, data:tweets[i]});
			newTweetCount++;
		}
	}
	hasFirstTweets = true;
	//logMessage(tweets.length + " tweets received");
	//logMessage(newTweetCount + " tweets added to cache of tweets to be displayed.");
}


function updateTweetDisplay(){
	if (cachedNewTweets.length > 0){
		try{
			var tweet = cachedNewTweets.shift();
			setTweet(tweet.div, tweet.id, tweet.data.created_at);
		}
		catch(e){
			logMessage("caught error: " + e);
		}
	}
	else{
		//logMessage("tweet cache is empty");
	}
	//// this updates the "pretty date" for each displayed tweet
	for (var id in displayedTweets){
		$('#tweetDate' + id).empty().append("(" + prettyDate(displayedTweets[id]) + ")");
	}
	
}
function setTweet(divString, idString, dateString){
	$($("#twitterStreamContainer").prepend(divString).children().get(0)).slideToggle("fast");
	displayedTweets[idString] = dateString;
	//// trim the displayed tweets and the displayedTweets array avoiding memory leak
	var len = $("#twitterStreamContainer").children().length;
	if (len > 30){
		var myID = $($("#twitterStreamContainer").children().get(len-1)).attr("id");
		delete displayedTweets[myID];
		$($("#twitterStreamContainer").children().get(len-1)).remove();
	}
}


/*
 * JavaScript Pretty Date
 * Copyright (c) 2008 John Resig (jquery.com)
 * Licensed under the MIT license.
 */
// converts ISO time to casual time
function prettyDate(time){
	var date = new Date((time || "").replace(/-/g,"/").replace(/TZ/g," ")),
		diff = (((new Date()).getTime() - date.getTime()) / 1000),
		day_diff = Math.floor(diff / 86400);
			
	if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 )
		return;
	var v = day_diff == 0 && (
			diff < 60 && "just now" ||
			diff < 120 && "1 minute ago" ||
			diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
			diff < 7200 && "1 hour ago" ||
			diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
		day_diff == 1 && "Yesterday" ||
		day_diff < 7 && day_diff + " days ago" ||
		day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
	if (!v)
		window.console && console.log(time);
	return v ? v : '';
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};













/******************************************************************
  COPYTOCLIPBOARD SWF METHODS
******************************************************************/
function onCopyToClipBoardSWFReady(){
	copyToClipBoardSWF = $("#copyToSWF").get(0);
	updateCopyToClipBoardSWF(roomURLInput.value);
}
function updateCopyToClipBoardSWF(p_text){
	if (copyToClipBoardSWF) copyToClipBoardSWF.copyToClipBoard(p_text);
}			










/*********************************************
  Flash LSO Shim methods.
  This purpose of this shim is to cache
  the twitter friends for the current user
  to avoid Twitter api rate limiting failures
*********************************************/
function thisMovie(movieName) {
     if (navigator.appName.indexOf("Microsoft") != -1) {
         return window[movieName];
     } else {
         return document[movieName];
         alert(document[movieName]);
     }
}
function lsoShimMessage(message){
	//logMessage("lso shim: " +  message );
}
function saveFriendsToLSO(){
	lsoShim.jsSetFriends(friendScreenNames, currentTwitterScreenName);
}
function retrieveFriendsFromLSO(){
	try{
		var lsoObj = lsoShim.jsGetFriends();
		//logMessage("Local Shared Object: username: " + lsoObj.username + ", friends:  " + lsoObj.friends.length);
		if (lsoObj.username == currentTwitterScreenName){
			friendScreenNames = lsoObj.friends;
		}
		else{
			friendScreenNames = [];
		}	
	}
	catch(e){logMessage("Error retrieveFriendsFromLSO: " + e)};
}










/***************************
  UTILITY methods
***************************/
//// METHOD to get query string value based on supplied key
function getQueryVariable(variable) {
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
			if (pair[0] == variable) return pair[1];
	}
}

function loadLiveStream(){
	switch (tokliveParams.streamProvider){
		case "ustream":
			swfobject.embedSWF("http://www.ustream.tv/flash/viewer.swf", "liveVideoInnerContainer", "480", "296", "10.0.0", "expressInstall.swf", {cid:tokliveParams.streamId,autoplay:true}, {menu:"false", allowscriptaccess:"always", wmode:"transparent", allowFullScreen:"true"}, {id:"live_embed_player_flash"});
			break;
		case "justin.tv":
			swfobject.embedSWF("http://www.justin.tv/widgets/live_embed_player.swf", "liveVideoInnerContainer", "480", "296", "10.0.0", "expressInstall.swf", {channel:tokliveParams.streamId, auto_play:"true", start_volume:25}, {menu:"false", allowscriptaccess:"always", wmode:"transparent", allowFullScreen:"true"}, {id:"live_embed_player_flash"});
			break;
		case "livestream":
			swfobject.embedSWF("http://cdn.livestream.com/grid/LSPlayer.swf", "liveVideoInnerContainer", "480", "296", "10.0.0", "expressInstall.swf", {channel:tokliveParams.streamId, autoplay:true}, {menu:"false", allowscriptaccess:"always", wmode:"transparent", allowFullScreen:"true"}, {id:"live_embed_player_flash"});
			break;
		default:
			logMessage("stream provider not set");
			break;
	}
}

function setShareURL(){
	var deepLinkURL = tokliveParams.baseURL + "?id=" + theSessionId;
	$("#roomURLInput").get(0).value = deepLinkURL;
	updateCopyToClipBoardSWF(deepLinkURL); 
	//logMessage("share url set: " + deepLinkURL);
}

function logMessage(message){
	if (tokliveParams.isDebugMode){
		try{ console.log(message);} 
		catch(e){ /* alert(message); */}
	}
}

function isFull(){
	return participants >= maxParticipants;
}

function updateJoinButton(){	
	if (isFull() && !isPublishing){
		$("#newTokboxSessionButton").html("Full Room");
	}
	else if (isPublishing){
		$("#newTokboxSessionButton").html("Exit Session");
	}
	else{
		$("#newTokboxSessionButton").html("New Session");
	}
}




function togglePanelContentTwoDisplay(){
	$("#panelContentTwo").slideToggle("fast");
	isPanelTwoOpen = !isPanelTwoOpen;		
	$("#panelButtonTwo").get(0).innerHTML = isPanelTwoOpen?'<img src="images/arrow-close.png" alt="arrow-open" width="11" height="8" />':'<img src="images/arrow-open.png" alt="arrow-open" width="11" height="8" />';															
	if (isPanelTwoOpen) loadTokLiveRooms();
}


function togglePanelContentThreeDisplay(){ 
	$("#panelContentThree").slideToggle("fast");
	isPanelThreeOpen = !isPanelThreeOpen;
	if (!isTweetStreamStarted){
		//// START twitter stream widget
		isTweetStreamStarted = true;
		$("#twitterSearchTerms").html("search terms: " + tokliveParams.twitterTerms);
		getTweets();
		setInterval(getTweets, 30000);
		setInterval(updateTweetDisplay, 5000);
	}
	if (isPanelThreeOpen){ 
		$("#panelThreeHeaderButtons").css("display", "block");
	}
	else{
		$("#panelThreeHeaderButtons").css("display", "none");
	}
}

function setPanelTwoHeaderText(){
	if (isPublishing){
		$("#panelThreeHeaderParticipateButton").html("View");
/* 		$("#panelThreeHeaderParticipateButton").css("display", "block");	 */
		$("#numberParticipantsText").css("display", "block");
		$("#panelTwoInstructionText").html("SELECT - Participating in Session " + currentSessionName);	
	}
	else if (isViewingOnly && isSessionConnected){
		$("#panelThreeHeaderParticipateButton").html("Participate");
/* 		$("#panelThreeHeaderParticipateButton").css("display", "block");		 */
		$("#panelTwoInstructionText").html("SELECT - Viewing Session " + currentSessionName);	
		$("#numberParticipantsText").css("display", "block");
	}
	else{
/* 		$("#panelThreeHeaderParticipateButton").css("display", "none");		 */
		$("#numberParticipantsText").css("display", "none");	
		$("#panelTwoInstructionText").html("SELECT a session to participate in or view, and see which sessions your Twitter friends are in.");
	}
	$("#numberParticipantsText").html(watchers + " viewers, " + participants + " participants");
}

function initializeStreamContainers(){
	availableStreamContainers = [];
	activeStreamContainers = [];
	availableStreamContainers.push({index:1, stream:$("#stream_1").get(0), label:$("#stream_name_1").get(0)});
	availableStreamContainers.push({index:2, stream:$("#stream_2").get(0), label:$("#stream_name_2").get(0)});
	availableStreamContainers.push({index:3, stream:$("#stream_3").get(0), label:$("#stream_name_3").get(0)});
	availableStreamContainers.push({index:4, stream:$("#stream_4").get(0), label:$("#stream_name_4").get(0)});
	availableStreamContainers.push({index:5, stream:$("#stream_5").get(0), label:$("#stream_name_5").get(0)});
	availableStreamContainers.push({index:6, stream:$("#stream_6").get(0), label:$("#stream_name_6").get(0)});
	availableStreamContainers.push({index:7, stream:$("#stream_7").get(0), label:$("#stream_name_7").get(0)});
	availableStreamContainers.push({index:8, stream:$("#stream_8").get(0), label:$("#stream_name_8").get(0)});
	availableStreamContainers.push({index:9, stream:$("#stream_9").get(0), label:$("#stream_name_9").get(0)});
	availableStreamContainers.push({index:10, stream:$("#stream_10").get(0), label:$("#stream_name_10").get(0)});
	/*
var len = availableStreamContainers.length;
	for (var i=0; i<len; i++){	
		try{availableStreamContainers[i].label.innerHTML = "";}
		catch(e){logMessage("CAUGHT error blanking label");}
	}
*/
}









/***************************
 TOK BOX METHODS
***************************/
function fetchTokBoxToken(p_isInitSession){
	$.post(tokliveParams.baseURL + "php/GetSession.php", {sessionId:theSessionId},
		function(data){
			try{
				testInitData = data;
				theSessionId = data.sessionId;
				myInitialSessionID = data.sessionId;
				sessionToken = data.token;
				logMessage("TokBox token acquired using session: " + data.sessionId);
				if (p_isInitSession){
					// if the session exists we need to destroy the session and start a new one
					if (theSession){
						startNewSessionAfterDestroy = true;
						destroyTokBoxSession();
					}
					else{
						initializeTokBoxSession();
					}
				}
			}
			catch(e){
				alert("OpenTok failed to initialize");
			}
		}, "json");
}



function initializeTokBoxSession(){
	if (!isPanelThreeOpen) togglePanelContentThreeDisplay();
	initializeStreamContainers();
	logMessage("initializeTokBoxSession session: " + theSessionId);
	if (TB.checkSystemRequirements() != TB.HAS_REQUIREMENTS) alert("OpenTok: Minimum System Requirements not met.");
	theSession = TB.initSession(theSessionId);
	TB.addEventListener("exception", exceptionHandler);
	theSession.addEventListener("sessionConnected", sessionConnectedHandler);
	theSession.addEventListener("connectionCreated", connectionCreatedHandler);
	theSession.addEventListener("connectionDestroyed", connectionDestroyedHandler);
	theSession.addEventListener("streamCreated", streamCreatedHandler);
	theSession.addEventListener("streamDestroyed", streamDestroyedHandler);
	theSession.addEventListener("sessionDisconnected", sessionDisconnectHandler);		
	theSession.connect(thePartnerKey, sessionToken);
	setShareURL();
}

function destroyTokBoxSession(){
	logMessage("destroying tokbox session: ");
	if (isPublishing) stopPublishing();
	try{
		theSession.disconnect();
		logMessage("TokBox Session disconnection ...");
	}
	catch(e){
		logMessage("CAUGHT ERROR: disconnectTokBoxSession: " + e);
	}
	initializeStreamContainers();
}





function getStreamContainerObj(connectionId){
	var streamContainerObj;
	if (availableStreamContainers.length > 0){ 
		streamContainerObj = availableStreamContainers.shift();
		streamContainerObj.connectionId = connectionId;
		activeStreamContainers[connectionId] = streamContainerObj;
	}
	return streamContainerObj;	
}

function recycleStreamContainerObj(connectionId){
	logMessage("recycle StreamContainerObj");
	var streamConObj = activeStreamContainers[connectionId];
	if (streamConObj){
		availableStreamContainers.unshift(streamConObj);
		streamConObj.connectionId = null;
		streamConObj.label.innerHTML = "disconnected";
		var streamContainer = streamConObj.stream;
		//remove all the children from the stream div container
		//$(streamConObj).empty();
		while (streamContainer.hasChildNodes()) {
    		streamContainer.removeChild(streamContainer.lastChild);
		}
		delete activeStreamContainers[connectionId];
	}
	else{
		alert("failed to recycle stream container: " + connectionId);
	}
}



// messages to a Javascript alert box 
function exceptionHandler(e) {
	logMessage("Exception: "+e.code+"::"+e.message);
}

// Generic function to dump streamEvents to the alert box
function dumpStreams(streams, reason) {
	for (var i=0; i<streams.length; i++) {
		alert("streamID: "+streams[i].streamId + "\n" +
			"connectionId: "+streams[i].connection.connectionId +" \n" +
			"type: "+streams[i].type +"\n" +
			"name: "+streams[i].name +"\n" +
			"reason: "+reason);
	}
}

// Generic function to dump connectionEvents to the alert box
function dumpConnections(connections, reason) {
	for (var i=0; i<connections.length; i++) {
		alert("connectionId: "+connections[i].connectionId +" \n" +
			"reason: "+reason);
	}
}



// Action functions

// Called when user wants to start participating in the call
function startPublishing() {
	if (!isFull()){
		// Starts publishing user local camera and mic
		// as a stream into the session
		var username = currentTwitterScreenName;
		var streamContainerObj = getStreamContainerObj(myConnectionId); 
		if (streamContainerObj){
			//streamContainerObj.label.style.display = "none"; //his this div because it interferes with th Flash Control Panel
			localUserStreamContainerObj = streamContainerObj;
			isPublishing = true;
			if (isViewingOnly) tellTokLiveDBViewerLeaving();
			tellTokLiveDBParticipantJoined();
			wantsToParticipate = false; //set to false because now we are participating
			isViewingOnly = false;
			var parentDiv =  streamContainerObj.stream
			var stubDiv = document.createElement("div");
			stubDiv.id = "tbx_publisher";
			parentDiv.appendChild(stubDiv);
			thePublisher = theSession.publish(stubDiv.id, {width: PUBLISHER_WIDTH, height: PUBLISHER_HEIGHT, name:username});
			updateStatusText("Trying to join the call...");
			if (isPanelTwoOpen) togglePanelContentTwoDisplay();
			updateJoinButton(); 
			var labelName = currentTwitterScreenName;
			streamContainerObj.label.innerHTML = labelName; 
			streamContainerObj.userName = currentTwitterScreenName;
			myStreamContainerObj = streamContainerObj;
		}
		$('#newTokboxSessionButton').html("Exit session");
	}
}



// Called when user wants to stop participating in the call
function stopPublishing() {
	logMessage("stopPublishing: " + localUserStreamContainerObj);
	if (isPublishing){
		tellTokLiveDBParticipantLeaving();
		tellTokLiveDBViewerJoined();
	}
	isPublishing = false;
	isViewingOnly = true;
	if (thePublisher != null) {
		theSession.unpublish(thePublisher);
		thePublisher = null;
	}
	if (localUserStreamContainerObj){
		logMessage("recycling ");
		updateJoinButton(); 
		localUserStreamContainerObj.label.innerHTML = "Disconnected"; 
		recycleStreamContainerObj(myConnectionId);
		localUserStreamContainerObj = null;
	}
	$('#newTokboxSessionButton').html("New Session");	
	updateCountDisplays();
}

// Called to subscribe to a new stream
function subscribeToStream(session, stream) {
	// Create a div for the subscribe widget to replace
	var streamContainerObj = getStreamContainerObj(stream.connection.connectionId); 
	if (streamContainerObj){
		var parentDiv = streamContainerObj.stream; 
		var stubDiv = document.createElement("div");
		stubDiv.id = "tbx_subscriber_" + stream.streamId;
		parentDiv.appendChild(stubDiv);
		var labelDiv = streamContainerObj.label; 
		labelDiv.innerHTML = stream.name;
		streamContainerObj.userName = stream.name; 
		userNames[stream.connection.connectionId] = stream.name;
		session.subscribe(stream, stubDiv.id, {width: SUBSCRIBER_WIDTH, height: SUBSCRIBER_HEIGHT});
	}
	participants++;
}

// Called to unsubscribe from an existing stream
function unsubscribeFromStream(session, stream) {
	var subscribers = session.getSubscribersForStream(stream);

	for (var i=0; i<subscribers.length; i++) {
		session.unsubscribe(subscribers[i]);
		participants--;
	}
}

// Called to update watcher / participant counts on screen
function updateCountDisplays() {
	//logMessage("updateCountDisplays");
	setPanelTwoHeaderText();
	loadTokLiveRooms();
}


// TOKBOX Handler functions
function sessionConnectedHandler(e) {
	// Note that we are included in connectionEvents
	// We can know which one is us by comparing to e.target.connection.connectionId
	isSessionConnected = true;
	myConnectionId = e.target.connection.connectionId;			
	var streamConnectionIds = {};
	var streamConnections = 0; // Number of connections with a stream
	if (debug) {
		alert("sessionConnectedHandler");
		dumpConnections(e.connections, "");
		dumpStreams(e.streams, "");
	}

	// Now possible to join a call

	updateStatusText("You are watching the call");

	// Display streams on screen
	for (var i=0; i<e.streams.length; i++) {
		subscribeToStream(e.target, e.streams[i]);
		// Track unique connectionIds

		if (!streamConnectionIds.hasOwnProperty(e.streams[i].connection.connectionId)) {
			streamConnectionIds[e.streams[i].connection.connectionId] = true;
			streamConnections++;
		}
	}
	watchers = e.connections.length - streamConnections;
	isViewingOnly = true;	
	tellTokLiveDBViewerJoined();
	if (wantsToParticipate) {
		startPublishing();
	}
	updateCountDisplays();
	//logMessage("connected to opentok session: " + theSessionId);
	//logMessage("connected to opentok connection: " + myConnectionId);	
}


function connectionCreatedHandler(e) {
	// Note that we will do not get a connectionCreated
	// event for ourselves when we connect - that case
	// is handled by the sessionConnected event
	//logMessage("connectionCreatedHandler");

	if (debug) {
		alert("connectionCreatedHandler");
		dumpConnections(e.connections, "");
	}
	watchers += e.connections.length;
	updateCountDisplays();
}


function connectionDestroyedHandler(e) {
	if (debug) {
		alert("connectionDestroyedHandler");
		dumpConnections(e.connections, e.reason);
	}
	watchers -= e.connections.length;
	updateCountDisplays();
}





function streamCreatedHandler(e) {
	if (debug) {
		alert("streamCreatedHandler");
		dumpStreams(e.streams, "");
	}
	//logMessage("streamCreatedHandler");
	// Display streams on screen.  Note that
	// we will get a streamCreated event for ourselves
	// when we successfully start publishing
	for (var i=0; i<e.streams.length; i++) {
		var conenctionID = e.streams[i].connection.connectionId; 
		if (e.streams[i].connection.connectionId != e.target.connection.connectionId) {
			subscribeToStream(e.target, e.streams[i]);
			watchers--;
		} else {
			// Our publisher just started streaming
			// Update status, controls and counts
			updateStatusText("You are participating in the call");
			participants++;
			watchers--;
		}
	}
	updateCountDisplays();
	//if (myStreamContainerObj) myStreamContainerObj.label.style.display = "block";
	//logMessage("streamCreatedHandler");
}




function streamDestroyedHandler(e) {
	if (debug) {
		alert("streamDestroyedHandler");
		dumpStreams(e.streams, e.reason);
	}
	// Remove streams from screen.  Note that
	// we will get a streamDestroyed event for ourselves
	// when we successfully stop publishing

	for (var i=0; i<e.streams.length; i++) {
		if (e.streams[i].connection.connectionId != e.target.connection.connectionId) {
			unsubscribeFromStream(e.target, e.streams[i]);
			recycleStreamContainerObj(e.streams[i].connection.connectionId); 
			watchers++;
		} else {
			// Our publisher just stopped streaming
			// Update status, controls and counts
			updateStatusText("You are watching the call");
			participants--;
			watchers++;
		}
	}

	updateCountDisplays();
}

function sessionDisconnectHandler(e){
	logMessage("sessionDisconnectHandler: disconnected from session. Cleaning up");
	theSession.removeEventListener("sessionConnected", sessionConnectedHandler);
	theSession.removeEventListener("connectionCreated", connectionCreatedHandler);
	theSession.removeEventListener("connectionDestroyed", connectionDestroyedHandler);
	theSession.removeEventListener("streamCreated", streamCreatedHandler);
	theSession.removeEventListener("streamDestroyed", streamDestroyedHandler);
	theSession.removeEventListener("sessionDisconnected", sessionDisconnectHandler);
	TB.removeEventListener("exception", exceptionHandler);
	theSession.cleanup();
	theSession = null;
	isSessionConnected = false;
	if (isViewingOnly){	
		tellTokLiveDBViewerLeaving();
		isViewingOnly = false;
	}
	isPublishing = false;
	participants = 0;
	watchers = 0;
	currentSessionName = "";
	updateCountDisplays();
	if (startNewSessionAfterDestroy) {
		initializeTokBoxSession();
		startNewSessionAfterDestroy = false;
	}
	loadTokLiveRooms();
}

function updateStatusText(p_status){
	if (tokliveParams.isDebugMode) logMessage("######## " + p_status);
}






















