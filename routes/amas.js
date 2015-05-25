var mongoose = require("mongoose");
var questions = mongoose.model('questions');

function sendERR(err, res) {
    res.send("{ \"message\": \"" + err + "\" }");
}
exports.questionsPOST = function(req, res) {
	var data = req.body;
	try {
	    var newquestion = new questions({
	        askerId: data.askerId,
	        seriesId: data.seriesId,
	        question: data.question
	    });
	    newquestion.save(function(err) {
	        console.log('save function');
	        if (err) {
	            console.log('error');
	        } else {
	            res.send("{ \"message\": \"question created\", \"id\": \"" + newquestion._id + "\" }");
	        }
	    });

	} catch (err) {
	    console.log('error in post channels');
	    sendERR(err, res);
	}
};
exports.questionsUPDATE = function(req, res) {
	var data = req.body;
	console.log(data);
	console.log(data.answer);
    questions.findByIdAndUpdate(
        req.params.id, {
            $push: {
                "answer": data.answer
            }
        }, {
            safe: true,
            upsert: true
        },
        function(err, model) {
            console.log('save function');
            if (err) {
                console.log('error');
            } else {
                res.send("{ \"message\": \"question updated\", \"id\": \"" + model._id + "\" }");
            }
        }
    );
};
exports.questionsDELETE = function(req, res) {
	var questionId = req.params.id;
	try {
		questions.remove({ _id: questionId}, function(err) {
		    if (!err) {
					res.send("{ \"message\": \"question deleted\" }");
		    }
		    else {   
					res.send("{ \"message\": \""+err+"\" }");
		    }
		});
	} catch (err) {
		sendERR(err, res)
	}
};
exports.questionsGETUID = function(req, res) {
	console.log('questions get user id');
	try {
		questions.find({_id: req.params.id}, function(err, doc) {
			if (err) console.log(err);
			if(doc) res.send("{ \"message\": \"questions found\", \"document\": "+JSON.stringify(doc)+" }");
		});
	} catch (err) {
		sendERR(err, res);
	}
};
exports.questionsGETSID = function(req, res) {
	console.log('questions get series id');
	try {
		questions.find({_id: req.params.id}, function(err, doc) {
			if (err) console.log(err);
			if(doc) res.send("{ \"message\": \"questions found\", \"document\": "+JSON.stringify(doc)+" }");
		});
	} catch (err) {
		sendERR(err, res);
	}
};
exports.questionsGET = function(req, res) {
	console.log('questions get');
	try {
		questions.find({_id: req.params.id}, function(err, doc) {
			if (err) console.log(err);
			if(doc) res.send("{ \"message\": \"questions found\", \"document\": "+JSON.stringify(doc)+" }");
		});
	} catch (err) {
		sendERR(err, res);
	}
};