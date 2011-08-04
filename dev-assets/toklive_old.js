// var baseURL = "http://www.randytroppmann.com/tube-it/" //// NOTE: initialization of this property moved to index.html
var maxParticipants = 8;			// max participants 
var theSessionId; 					// TokBox SessionID TODO: hook up to serverside API to make this dynamic. 1922f048b6cf0b1972819be108df8c5a9fd937a5
var isRoomCreator = true;			// Flag to used in certain async processes
var userNames = new Array();		// asscoiative array: key is connectionId
var sessionToken = "";				// used for TokBox session.connect
var theSession = null;				// TokBox session object
var thePublisher = null;			// TokBox publisher object
var myConnectionId;					// TokBox generated connection ID for browser instance
var participants = 0;				// Number of paticipants in the call
var watchers = 0;					// Number of users watching but not participating
var debug = true; 					// ToxBox event alerting
var $modal1;						// Reference to modal dialog that appears on startup
var $modalConnecting;				// Reference to a modal dialog that states the app is connecting
var isPublishing = false;			// Is browser instance publishing video stream through 
var localUserName = "not connected";	// This is captured in $modal1
var clipboard = null;				// ZeroClipboard reference - see initialize()
var PUBLISHER_WIDTH = 160;			// video widget dimension
var PUBLISHER_HEIGHT = 120;			// video widget dimension
var SUBSCRIBER_WIDTH = 160;			// video widget dimension
var SUBSCRIBER_HEIGHT = 120;		// video widget dimension
var joinButton; 					// reference to the top right Join Button container
var roomURLInput;					// reference to the input control holding the room URL
var copyURLButtonRef;				// reference to the copy URL button
var copyToClipBoardSWF;				// reference to swf helper used to copy URL to clipboard
//// TokBox stream container pool 
var	activeStreamContainers = new Array();//associative array with connectionId as the key
var availableStreamContainers = new Array();
var localUserStreamContainerObj;
//// Twitter
var twitterConnectButton;
var isConnectedToTwitter = false;


//// Begin other initilization when jquery says everything is ready
$(document).ready(initialize);

/***************************
  INITIALIZE METHODS
***************************/
function initialize() {
	//showConnectingModal();
	joinButton = $("#joinButton").get(0);
	roomURLInput = $("#roomURL").get(0);
	copyURLButtonRef = $("#copyURLButton").get(0);
	twitterConnectButton = $("#twitterConnectButton").get(0);
	
	// INITIALIZE scroll pane
	$('#tweetsPane').jScrollPane();
	
	// INITIALIZE clipboad copy stuff
	swfobject.embedSWF("scripts/copytoclipboard.swf", "copyToClipboardSWF", "42", "30", "9.0.0", "expressInstall.swf", null, {menu: "false", allowscriptaccess:"always", wmode:"transparent"}, {id:"copyToSWF"});

	// INITIALIZE the stream container pool
	availableStreamContainers.push({index:1, stream:$("#stream_1").get(0), label:$("#stream_name_1").get(0)});
	availableStreamContainers.push({index:2, stream:$("#stream_2").get(0), label:$("#stream_name_2").get(0)});
	availableStreamContainers.push({index:3, stream:$("#stream_3").get(0), label:$("#stream_name_3").get(0)});
	availableStreamContainers.push({index:4, stream:$("#stream_4").get(0), label:$("#stream_name_4").get(0)});
	availableStreamContainers.push({index:5, stream:$("#stream_5").get(0), label:$("#stream_name_5").get(0)});
	availableStreamContainers.push({index:6, stream:$("#stream_6").get(0), label:$("#stream_name_6").get(0)});
	availableStreamContainers.push({index:7, stream:$("#stream_7").get(0), label:$("#stream_name_7").get(0)});
	availableStreamContainers.push({index:8, stream:$("#stream_8").get(0), label:$("#stream_name_8").get(0)});
	//availableStreamContainers.push({index:9, stream:$("#stream_9").get(0), label:$("#stream_name_9").get(0)});
	//availableStreamContainers.push({index:10, stream:$("#stream_10").get(0), label:$("#stream_name_10").get(0)});

	if (getQueryVariable("id")){
		//// if the query string variable is populated the owner of this instance is not
		//// the original owner of this room.
		theSessionId = getQueryVariable("id");
		isRoomCreator = false;
		isVideoOwner = false;
	}

	//// Initialize twitter API
	initializeTwitter();
	setInterval(searchTwitter, 60000); 

	//// FETCH TokBox Token
	/*
$.post(baseURL + "php/GetSession.php", {sessionId:theSessionId},
   		function(data){
   			try{
   				theSessionId = data.sessionId;
   				sessionToken = data.token;
   				initializeTB();
   			}
   			catch(e){
   				alert("OpenTok failed to initialize");
   			}
   		}, "json");
*/	 		
}

function initializeTB(){
	//// TokBox initialization
	if (TB.checkSystemRequirements() != TB.HAS_REQUIREMENTS) {
		alert("Minimum System Requirements not met!");
	}
	theSession = TB.initSession(theSessionId);
	TB.addEventListener("exception", exceptionHandler);
	theSession.addEventListener("sessionConnected", sessionConnectedHandler);
	theSession.addEventListener("connectionCreated", connectionCreatedHandler);
	theSession.addEventListener("connectionDestroyed", connectionDestroyedHandler);
	theSession.addEventListener("streamCreated", streamCreatedHandler);
	theSession.addEventListener("streamDestroyed", streamDestroyedHandler);		
	// Connect to the session
	theSession.connect(thePartnerKey, sessionToken);
	setShareURL();
}





/******************************************************************
  COPYTOCLIPBOARD METHODS
  this uses a custom made swf
******************************************************************/

function onCopyToClipBoardSWFReady(){
	copyToClipBoardSWF = $("#copyToSWF").get(0);
	updateCopyToClipBoardSWF(roomURLInput.value);
}
function updateCopyToClipBoardSWF(p_text){
	if (copyToClipBoardSWF) copyToClipBoardSWF.copyToClipBoard(p_text);
}			
function setRoomURL(p_text){
	roomURLInput.value = p_text;
	updateCopyToClipBoardSWF(p_text)
}





/******************************************************************
  TWITTER METHODS
******************************************************************/

function initializeTwitter(){
	//twttr.anywhere(function (T) { T("#twitterLoginButton").connectButton({ size: "large" }); });
	twttr.anywhere(function (T) {				
	    T.bind("authComplete", function (e, user) {
			isConnectedToTwitter = true;
	    	twitterConnectButton.innerHTML = "sign out of twitter";
	    	//console.log("connected to twitter");
	    });
	
	    T.bind("signOut", function (e) {
			isConnectedToTwitter = false;
			twitterConnectButton.innerHTML = "connect with twitter";
	    	//console.log("disconnected from twitter");
	    });		
	    
	    
	    T("#tweetBoxContainer").tweetBox({
      		height: 100,
      		width: 274,
      		defaultContent: "Come and join the conversation about Google io"
    	});
	    
  	});
  	searchTwitter();
}

function searchTwitter(){
	//console.log("sending search request to twitter");
	 var fileref = document.createElement('script');
    // Creating a new script element
    fileref.setAttribute("type","text/javascript");
    fileref.setAttribute("src", "http://search.twitter.com/search.json?q=360flex&callback=TweetTick");
    // Setting its src to the search API URL; We provide TweetTick as a callback
    document.getElementsByTagName("head")[0].appendChild(fileref);
    // Appending it to the head of the page and thus executing it
}

function TweetTick(ob){
	//console.log("twitter search data recieved");
	var container=$('#tweetsPane');
	container.html('');
	$(ob.results).each(function(el){
        var str = ' <div class="tweet">\
        <div class="avatar"><a href="http://twitter.com/'+this.from_user+'" target="_blank"><img src="'+this.profile_image_url+'" alt="'+this.from_user+'" /></a></div>\
        <div class="user"><a href="http://twitter.com/'+this.from_user+'" target="_blank">'+this.from_user+'</a></div>\
        <div class="time">'+relativeTime(this.created_at)+'</div>\
        <div class="txt">'+formatTwitString(this.text)+'</div>\
        </div>';
        container.append(str);
    });
    
    var pane = $('#tweetsPane');
    var settings = { showArrows: true };
    pane.jScrollPane(settings);
    var api = pane.data('jsp');
    api.reinitialise();
/*
	$(function()
{
	var settings = {
		showArrows: true
	};
	var pane = $('.scroll-pane')
	pane.jScrollPane(settings);
	var api = pane.data('jsp');
	var i = 1;

	// Every second add some new content...
	setInterval(
		function()
		{
			api.getContentPane().append(
				$('<p />').text('This is paragraph number ' + i++)
			);
			// we could call "pane.jScrollPane(settings)" again but it is
			// more convenient to call via the API as then the original
			// settings we passed in are automatically remembered.
			api.reinitialise();
		},
		1000
	);
});
*/

}

function handleTwitterConnectButton(){
	if (isConnectedToTwitter){
		twttr.anywhere.signOut();
	}
	else{ 
		twttr.anywhere(function (T) { T.signIn();});
	}	
}

function formatTwitString(str){
    // This function formats the tweet body text
    str=' '+str;
    str = str.replace(/((ftp|https?):\/\/([-\w\.]+)+(:\d+)?(\/([\w/_\.]*(\?\S+)?)?)?)/gm,'<a href="$1" target="_blank">$1</a>');
    // The tweets arrive as plain text, so we replace all the textual URLs with hyperlinks
    str = str.replace(/([^\w])\@([\w\-]+)/gm,'$1@<a href="http://twitter.com/$2" target="_blank">$2</a>');
    // Replace the mentions
    str = str.replace(/([^\w])\#([\w\-]+)/gm,'$1<a href="http://twitter.com/search?q=%23$2" target="_blank">#$2</a>');
    // Replace the hashtags
    return str;
}


function relativeTime(pastTime){
    var origStamp = Date.parse(pastTime);
    var curDate = new Date();
    var currentStamp = curDate.getTime();
    var difference = parseInt((currentStamp - origStamp)/1000);
    if(difference < 0) return false;
    if(difference <= 5)          return "Just now";
    if(difference <= 20)         return "Seconds ago";
    if(difference <= 60)         return "A minute ago";
    if(difference < 3600)        return parseInt(difference/60)+" minutes ago";
    if(difference <= 1.5*3600)   return "One hour ago";
    if(difference < 23.5*3600)   return Math.round(difference/3600)+" hours ago";
    if(difference < 1.5*24*3600) return "One day ago";
    // If the tweet is older than a day, show an absolute date/time value;
    var dateArr = pastTime.split(' ');
    return dateArr[4].replace(/\:\d+$/,'')+' '+dateArr[2]+' '+dateArr[1] + (dateArr[3]!=curDate.getFullYear()?' '+dateArr[3]:'');
}











/******************************************************************
  VARIOUS view  and utility methods
******************************************************************/
function onJoinClick(){
	if(!isPublishing && isFull()){
		return;
	}
	else if (isPublishing){
		stopPublishing();
	} 
	else{
		startPublishing();
	} 
}

function updateJoinButton(){
	
	if (isFull() && !isPublishing){
		joinButton.innerHTML = "Full room";
	}
	else if (isPublishing){
		joinButton.innerHTML = "Stop participating";
	}
	else{
		joinButton.innerHTML = "Start participating";
	}

}


function onTweetButtonClick(){
	//// note: the twitter share api does not like adding a second key/value pair, 
	window.open('http://twitter.com/share?url=' + baseURL + '?id=' + theSessionId + '&via=tokbox&count=none&text=Come%20and%20join%20the%20viewing%20room!');
}

function isFull(){
	return participants >= maxParticipants;
}


//// METHOD to get query string value based on supplied key
function getQueryVariable(variable) {
	var queryString = window.location.search.substring(1);
	var query = queryString;
	var dashesIndex = queryString.indexOf("--"); //// see onTweetButtonClick as to why we do this
	if (variable.toLowerCase() =="v"){
		if (dashesIndex >=0){
			if (variable.toLowerCase() =="v")  return queryString.substr(dashesIndex + 2, 11);
		}
	}
	query = queryString.substr(0,dashesIndex);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
			if (pair[0] == variable) return pair[1];
	}
}







/******************************************************************
  MODAL DIALOG methods
******************************************************************/ 
function showJoinCallModal(){
	var modalButtons;
	var wTitle = "Tok Live!";
	var greeting = "Your name: ";
	if (!isPublishing && isFull()){
		modalButtons = { 	"Eavesdrop": function() {$(this).dialog("close");}}
		htmlString = '<p>Sorry, the conversation is full.<br/> But you can still listen in!</p>';
	}
	else if (!isRoomCreator){
		modalButtons = {"Join the conversation":function() {$(this).dialog("close");handleModalJoinClick(); }}
		greeting = "The Tube It screening has already started! <br/><br/>Your name:";
		htmlString = '<p>' + greeting + '</p> <input type="text" id="modalNameInput" value="' + localUserName + '" name="userName" onChange="onModalNameChange(this)" style="width:500px;" />';
	}
	else {
		modalButtons = {"Start a conversation": function() {$(this).dialog("close");handleModalJoinClick(); }}	
		greeting = "Welcome to your private Tube It room! <br/><br/>Your name:";
		htmlString = '<p>' + greeting + '</p> <input type="text" id="modalNameInput" value="' + localUserName + '" name="userName" onChange="onModalNameChange(this)" style="width:500px;" />';
	}
	
	$modal1 = $('<div></div>')
		.html(htmlString)
		.dialog({
			autoOpen: false,
			modal: true,
			title: wTitle,
			width: 530,
			buttons: modalButtons
		});
	//$modal1.dialog({ close: function(event, ui) { });
	$modal1.dialog('open');
}

function onModalNameChange(input){
	localUserName = input.value;
}


function closeModal1(){
	$modal1.dialog('close');
}

function showConnectingModal(){
	$modalConnecting = $('<div></div>')
		.html('<p>Connecting to TokBox server ...</p>')
		.dialog({
			autoOpen: false,
			width: 530,
			modal: true
		});

		$modalConnecting.dialog('open');

}

function handleModalJoinClick(){
	startPublishing();	
}







/******************************************************************
  TOKBOX related methods
******************************************************************/

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
	var streamConObj = activeStreamContainers[connectionId];
	if (streamConObj){
		availableStreamContainers.unshift(streamConObj);
		streamConObj.connectionId = null;
		streamConObj.label.innerHTML = "disconnected";
		var streamContainer = streamConObj.stream;
		//remove all the children from the stream div container
		while (streamContainer.hasChildNodes()) {
    		streamContainer.removeChild(streamContainer.lastChild);
		}
		delete activeStreamContainers[connectionId];
	}
	else{
		//alert("failed to recycle stream container: " + connectionId);
	}
}



// messages to a Javascript alert box 
function exceptionHandler(e) {
	alert("Exception: "+e.code+"::"+e.message);
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
		var username = localUserName;
		if (isVideoOwner) username += hasControlString;
		var streamContainerObj = getStreamContainerObj(myConnectionId); 
		if (streamContainerObj){
			localUserStreamContainerObj = streamContainerObj;
			isPublishing = true; 
			var parentDiv =  streamContainerObj.stream
			var stubDiv = document.createElement("div");
			stubDiv.id = "tbx_publisher";
			parentDiv.appendChild(stubDiv);
			thePublisher = theSession.publish(stubDiv.id, {width: PUBLISHER_WIDTH, height: PUBLISHER_HEIGHT, name:username});
			updateStatusText("Trying to join the call...");
			updateJoinButton(); 
			var labelName = localUserName;
			if (isRoomCreator && isVideoOwner) labelName += hasControlString;
			streamContainerObj.label.innerHTML = labelName; 
			streamContainerObj.userName = localUserName;
		}
	}
}



// Called when user wants to stop participating in the call
function stopPublishing() {
	isPublishing = false;
	if (thePublisher != null) {
		theSession.unpublish(thePublisher);
		thePublisher = null;
	}
	if (localUserStreamContainerObj){
		updateStatusText("Leaving the call...");
		updateJoinButton(); 
		localUserStreamContainerObj.label.innerHTML = "Disconnected"; 
		recycleStreamContainerObj(myConnectionId);
		delete localUserStreamContainerObj;
	}
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
	updateJoinButton(); 
}


// TOKBOX Handler functions
function sessionConnectedHandler(e) {
	// Note that we are included in connectionEvents
	// We can know which one is us by comparing to e.target.connection.connectionId
	
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
	updateCountDisplays();
	$modalConnecting.dialog('close'); 
	showJoinCallModal(); 
}


function connectionCreatedHandler(e) {
	// Note that we will do not get a connectionCreated
	// event for ourselves when we connect - that case
	// is handled by the sessionConnected event

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

function updateStatusText(p_status){
	//try { document.getElementById("status").innerHTML = p_status; }
	//catch(e){}
}










