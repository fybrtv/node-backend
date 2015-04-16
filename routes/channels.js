var mongoose = require("mongoose");
var channels = mongoose.model('channels');
function sendERR(err, res) {
	res.send("{ \"message\": \"" + err + "\" }");
}
//userId will be stored in app session and then used to make requests to new channels and retrieval of channels. 
exports.channelsPOST = function(req, res, next) {
	var data = req.body;
  	try {
  		var newchannels = new channels({
			name: data.name,
		});  
		newchannels.save();
		res.send("{ \"message\": \"channels created\", \"id\": \""+ newchannels._id +"\" }");

  	} catch (err) {
  		console.channels('error in post channels');
  		sendERR(err, res);
  	}
}

exports.channelsIdPost = function(req, res, next) {
	var channelsId = req.params.id;
  	var data = req.body;

    try {
		channels.findOne({_id: channelsId}, function(err, doc) {
			if (err) console.channels(err);
		  	if (doc) {

		  		for (var key in data) {
		  			if (key != "_id" || key != "dateCreated") {
		  				if (data[key] != null) {
			  				doc[key] = data[key];
			  			} 
		  			}
		  		}

		  		doc.save(function(err) {
		  			if (err) {
		  				sendERR("Could not save the data", res)
		  			} else {
		  				res.send("{ \"message\": \"channels document updated successfully\" }");
		  			}
		  		});

		  	} else {
		  		sendERR("channels not found", res)
		  	}
		});
	} catch (err) {
		sendERR(err, res)
	}
}

exports.channelsIdGET = function(req, res) {
	var channelsId = req.params.id;
	try {
		channels.findOne({_id: channelsId}, function(err, doc) {
			if (err) console.channels(err);
			if (doc) {
				res.send("{ \"message\": \"channels found\", \"document\": "+JSON.stringify(doc)+" }");
			} else {
				res.send("{ \"message\": \"channels not found\" }");
			};
		});
	} catch (err) {
		sendERR(err, res)
	}
}
exports.channelsGET = function(req, res){
	var data = req.params.id;
	console.channels('channels get');
	try {
		channels.find({_id: data}, function(err, doc) {
			if (err) console.channels(err);
			if(doc) res.send("{ \"message\": \"channels found\", \"document\": "+JSON.stringify(doc)+" }");
		});
	} catch (err) {
		sendERR(err, res);
	}
}
exports.channelsIdDELETE = function(req, res) {
	var channelsId = req.params.id;
	console.channels(channelsId);
	try {
		channels.remove({ _id: req.params.id }, function(err) {
		    if (!err) {
					res.send("{ \"message\": \"channels deleted\" }");
		    }
		    else {   
					res.send("{ \"message\": \""+err+"\" }");
		    }
		});
	} catch (err) {
		sendERR(err, res)
	}
}