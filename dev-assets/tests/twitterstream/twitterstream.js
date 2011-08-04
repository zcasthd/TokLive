

$(document).ready(initialize);


function initialize() {
	twitterConnectButton = $("#twitterConnectButton").get(0);
	startTwitterSearchStream("Google");
}


function setTerm(){
	startTwitterSearchStream($('#searchTerm').get(0).value);
}

function startTwitterSearchStream(keyword){
	$('#twitter2').empty();
	$('#twitter2').twitterSearch({
		term: keyword,
		title: 'Search term: ' + keyword,
		titleLink: 'http://www.jquery.com',
		birdLink: 'http://twitter.com/jquery',
		css: { 
			img: { width: '30px', height: '30px' } 
		}
	});
}




