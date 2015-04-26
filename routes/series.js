var mongoose = require("mongoose");
var series = mongoose.model('series');
function sendERR(err, res) {
	res.send("{ \"message\": \"" + err + "\" }");
}
//userId will be stored in app session and then used to make requests to new series and retrieval of series. 
exports.seriesPOST = function(req, res, next) {
	var data = req.body;
  	try {
  		var newSeries = new series({
			creatorId: data.creatorId,
			channelId: data.channelId,
			score: data.score
		});  
		newSeries.save(function(err){
			console.log('save function');
			if(err){
				console.log(err);
			}
			else{
				res.send("{ \"message\": \"channels created\", \"id\": \""+ newSeries._id +"\" }");
			}
		});

  	} catch (err) {
  		console.log('error in post series');
  		sendERR(err, res);
  	}
}

exports.seriesIdPost = function(req, res, next) {
	var seriesId = req.params.id;
  	var data = req.body;

    try {
		series.findOne({_id: seriesId}, function(err, doc) {
			if (err) console.log(err);
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
		  				res.send("{ \"message\": \"Series document updated successfully\" }");
		  			}
		  		});

		  	} else {
		  		sendERR("Series not found", res)
		  	}
		});
	} catch (err) {
		sendERR(err, res)
	}
}

exports.seriesIdGET = function(req, res) {
	var seriesId = req.params.id;
	try {
		series.findOne({_id: seriesId}, function(err, doc) {
			if (err) console.log(err);
			if (doc) {
				res.send("{ \"message\": \"series found\", \"document\": "+JSON.stringify(doc)+" }");
			} else {
				res.send("{ \"message\": \"series not found\" }");
			};
		});
	} catch (err) {
		sendERR(err, res)
	}
}
exports.seriesUserIdGET = function(req, res) {
	var userId = req.params.id;
	try {
		series.find({userId: userId}, function(err, doc) {
			if (err) console.log(err);
			if (doc) {
				res.send("{ \"message\": \"series found\", \"document\": "+JSON.stringify(doc)+" }");
			} else {
				res.send("{ \"message\": \"series not found\" }");
			};
		});
	} catch (err) {
		sendERR(err, res)
	}
}
exports.seriesGET = function(req, res){
	if (req.query.name) 
	{
		var data = req.query.name;
		console.log('series get');
		try {
			series.findOne({title: data}, function(err, doc) {
				if (err) console.log(err);
				if(doc) {
					res.send("{ \"message\": \"series found\", \"document\": "+JSON.stringify(doc)+" }")
				}	else {
					sendERR("Series document not found", res);
				}
			});
		} catch (err) {
			sendERR(err, res);
		}
	} else {
		try {
			series.find({}, function(err, doc) {
				if (err) console.log(err);
				if(doc) {
					res.send("{ \"message\": \"series found\", \"document\": "+JSON.stringify(doc)+" }")
				}	else {
					sendERR("Series documents not found", res);
				}
			});
		} catch (err) {
			sendERR(err, res);
		}
	}
	
}
exports.seriesIdDELETE = function(req, res) {
	var seriesId = req.params.id;
	console.log(seriesId);
	try {
		series.remove({ _id: req.params.id }, function(err) {
		    if (!err) {
					res.send("{ \"message\": \"series deleted\" }");
		    }
		    else {   
					res.send("{ \"message\": \"Issue\" }");
		    }
		});
	} catch (err) {
		sendERR(err, res)
	}
}