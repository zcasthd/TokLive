var lastRecievedTweets;
var displayedTweets = [];
var cachedNewTweets = [];
var timeStamps = [];
var hasFirstTweets = false;
var messageIndex = 0;

$(document).ready(initialize);

function initialize(){
	console.log("initialized");
	getTweets();
	setInterval(getTweets, 30000);
	setInterval(updateTweetDisplay, 5000);

}

function getTweets(){
	var term = $('#searchTermInput').get(0).value;
	$.ajax({url:"http://search.twitter.com/search.json"
					,data:{q:term}
					,success:handleTweets
					,dataType:"jsonp"
					,cache:true});					
}

function handleTweets(data){
	var tweets = data.results;
	var newTweetCount = 0;
	setMessage(tweets.length + " tweets recieved");
	setMessage(cachedNewTweets.length + " tweets discarded from old cache");
	var len = tweets.length;
	cachedNewTweets = [];
	for (var i=len-1; i>=0; i--){
		var tweet = tweets[i];
		if (!displayedTweets[tweet.id_str]){
			var imageDiv = "<div class='tweetAvatar'><img src='" + tweet.profile_image_url + "'></div>";
			var usenameDiv = "<div><span class='twitterUsername'><a href='http://www.twitter.com/"+ tweets[i].from_user+"/' target='_blank'>" + tweets[i].from_user  + "</a></span><div class='tweetDate' id='tweetDate" + tweet.id_str + "'>(" + prettyDate(tweets[i].created_at) + ")</div></div>";
			var tweetContent = tweets[i].text.replace(/(http:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>');
			var tweetDiv = "<div>" + usenameDiv + tweetContent + "</div>";
			var divString = "<div class='tokTweet' id='" + tweet.id_str + "' style='display:none'>" + imageDiv + tweetDiv + "</div>";			
			if (!hasFirstTweets && i > 5) setTweet(divString, tweet.id_str, tweets[i].created_at);
			else cachedNewTweets.push({div:divString, id:tweet.id_str, data:tweets[i]});
			newTweetCount++;
		}
	}
	hasFirstTweets = true;
	setMessage(newTweetCount + " tweets added to new cache.");
	
}


function updateTweetDisplay(){
	if (cachedNewTweets.length > 0){
		try{
			var tweet = cachedNewTweets.shift();
			setTweet(tweet.div, tweet.id, tweet.data.created_at);
		}
		catch(e){
			setMessage("caught error: " + e);
		}
	}
	else{
		setMessage("tweet cache is empty");
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
function setMessage(message){
	messageIndex++;
	$('#consoleMessages').prepend("<p>" + messageIndex + ") " + message + "</p>");
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


/*

created_at: "Thu, 19 May 2011 03:25:34 +0000"
from_user: "HollowVirtue"
from_user_id: 177863774
from_user_id_str: "177863774"
geo: null
id: 71053856259325950
id_str: "71053856259325952"
iso_language_code: "ja"
metadata: Object
profile_image_url: "http://a2.twimg.com/profile_images/1333801092/twitter_normal.png"
source: "&lt;a href=&quot;http://twitter.com/&quot;&gt;web&lt;/a&gt;"
text: "コメントで書いた英語のチェックをGoogle翻訳でしたら、奇跡的に意図した通りの意味になった。何でだろう？ちょっと嬉しい。"
to_user_id: null
to_user_id_str: null
__proto__: Object

*/