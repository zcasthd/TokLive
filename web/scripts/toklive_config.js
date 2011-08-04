var tokliveParams = new TokliveParams();
/* EDIT THE PROPERTIES BELOW *****************************

	stream provider options are:
	- ustream
	- livestream
	- justin.tv
	
	examples:
	
	tokliveParams.streamProvider = "justin.tv";
	tokliveParams.streamId = "twit";

	tokliveParams.streamProvider = "livestream";
	tokliveParams.streamId = "boomchampionstt";

	tokliveParams.streamProvider = "ustream";
	tokliveParams.streamId = "1524";

*/

tokliveParams.baseURL = "http://www.randytroppmann.com/toklive/";
tokliveParams.twitterTerms = "leolaporte";
tokliveParams.streamProvider = "ustream";
tokliveParams.streamId = "1524";








/* DO NOT EDIT THIS METHOD **********************************/
function TokliveParams(){
	this.baseURL = "http://toklive.opentok.com/";
	this.twitterTerms = "";
	this.streamProvider = "";
	this.streamId = "";
	this.isDebugMode = true;
	this.logoURL;
}



