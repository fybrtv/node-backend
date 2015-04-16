var mongoose = require("mongoose");
var videoFile = mongoose.model('videoFile');
function sendERR(err, res) {
	res.send("{ \"message\": \"" + err + "\" }");
}
//userId will be stored in app session and then used to make requests to new log and retrieval of logs. 
exports.videoPOST = function(req, res, next) {
	var data = req.body;
  	try {
  		var newVideo = new video({
			seriesId: data.seriesId,
			fileName: data.fileName,
			length: data.length,
		});
		newVideo.save();
  	} catch (err) {
  		console.log('video post problem');
  		sendERR(err, res);
  	}
}