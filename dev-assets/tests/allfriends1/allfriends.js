$(document).ready(initialize);
var showData;
var twitterFriends;
var friendInterations;
var lookupCount;
var twitterUserName;
var friendScreenNames;

function initialize() {
	$('.log').ajaxError(function(e, xhr, settings, exception) {
		$(this).append('<p>' + e.type + ', status : ' + xhr.status + ' ' + xhr.statusText + '</p>');
	});
	
	/*
 $.ajaxSetup({"error":function(XMLHttpRequest,textStatus, errorThrown) {   
			alert(textStatus);
			alert(errorThrown);
			alert(XMLHttpRequest.responseText);
		}});
*/
}


function searchFriends(){
   	twitterUserName = $("#searchTerm").get(0).value;
   	$("#friendsList").empty();
	friendScreenNames = new Array();
	var urlTwitter = "http://api.twitter.com/1/users/show/" + twitterUserName + ".json";
	$.ajax({url:urlTwitter
					,data:{}
					,contentType: "application/jsonp; charset=utf-8"
					,success:handleTwitterUserDetails
					,dataType:'jsonp'
					,cache:true
					,error:ajaxErrorHandler
            		});
	$('.log').append("<p>getting user info</p>");
}


var ajaxErrorHandler = function(message){
	$('.log').append("<p>AJAX error</p>");
}



var handleTwitterUserDetails = function(data){
	twitterFriendsCount = data.friends_count;
	friendInterations =  Math.ceil(twitterFriendsCount/100);
	$('.log').append("<p>" + twitterUserName + " Friend count: " + twitterFriendsCount + "</p>");
	getFriends(-1);
}

function getFriends(cursor){
	if (cursor == undefined) cursor = -1;
	var urlFriends = "http://twitter.com/statuses/friends.json";
	$.ajax({url:urlFriends
					,data:{screen_name:twitterUserName,cursor:cursor}
					,success:handleTwitterFriends
					,dataType:"jsonp"
					,cache:true});
	console.log("friend list request sent");
	$('.log').append("<p>getting friends list</p>");
}

var handleTwitterFriends = function(data){
	showData = data;
	parseFriends(data.users);
	if (data.next_cursor) getFriends(data.next_cursor);	
	else $('.log').append("<p>Complete.</p>");	
}

function parseFriends(friends){
	var len = friends.length;
	for (var i=0; i<len; i++){
		friendScreenNames.push(friends[i].screen_name);
		$("#friendsList").append('<p>' + friendScreenNames.length + ") " + friends[i].screen_name + '</p>');
	}	
}

