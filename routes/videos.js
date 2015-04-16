var mongoose = require("mongoose");
var videoFile = mongoose.model('videoFile');
var series = mongoose.model('series');
var channels = mongoose.model('channel');
var timelines = mongoose.model('timeline');
var timeslots = mongoose.model('timeslot');

function sendERR(err, res) {
    res.send("{ \"message\": \"" + err + "\" }");
}
exports.videoPOST = function(req, res, next) {
    var data = req.body;
    try {
        series.findOne({
            _id: data.seriesId
        }, function(err, doc) {
            if (!err) {
                var score = doc.score;
                var newVideo = new video({
                    seriesId: data.seriesId,
                    fileName: data.fileName,
                    length: data.lengthOfFile
                });
                channels.findOne({
                        _id: doc.channelId
                    }, function(err, docchannel) {
                        if (!err) {
                            var availableTimeslots = [];
                            var range = ceil((doc.score / 100))
                            timelines.find({
                                $and: [{
                                    channelId: docchannel._id
                                }, {
                                    range: range
                                }]
                            }).sort({
                                dateStarted: "1"
                            }).exec(function(err, doctimelines) {
                                    if (doctimelines.length == 0) {

                                        var ts = new timeslots({
                                            start: 0,
                                            end: data.lengthOfFile,
                                            filename: data.fileName
                                        });
                                        var newTimeline = new timeline({
                                            dateStart: Date.now,
                                            timeslots: [ts],
                                            channelId: docchannel._id,
                                            range: range
                                        });

                                        newTimeline.save();
                                    } else {
                                        for (var i = 0; i < doctimelines.length; i++) { //check if anything is left

                                            var lastTime = doctimelines[i].timeslots[doctimelines[i].timeslots.length - 1];
                                            if ((60 - lastTime) > data.lengthOfFile) {
                                                var newTimeslot = new timeslots({
                                                    start: lastTime,
                                                    end: (lastTime + data.lengthOfFile),
                                                    filename: data.fileName
                                                });
                                                var updatedTimeslot = doctimelines[i].timeslots.push(newTimeslot);
                                                doctimelines[i].timeslots = updatedTimeslot;
                                                doctimelines.save();

                                            }
                                            // for(var t = 0;t < doctimelines[i].timeslots.length; t=t+2){
                                            // 	var slot1, slot2;
                                            // 	slot1 = doctimelines[i].timeslots[t];
                                            // 	slot2 = doctimelines[i].timeslots[(t+1)];
                                            // 	if((slot1.end - slot2.start) > data.lengthOfFile){
                                            // 		var newTimeslot = new timeslots({
                                            // 			start: slot1.end,
                                            // 			end: (slot1.end + data.lengthOfFile),
                                            // 			filename: data.fileName
                                            // 		});
                                            // 		doctimelines[i].timeslots.push(newTimeslot);
                                            // 		availableTimeslots.push(newTimeslot.id);
                                            // 	}
                                            // }
                                        }
                                    }});
                                } else {
                                    sendERR(err, res);
                                }
                            })
                        newVideo.save();
                    } else {
                        sendERR(err, res);
                    }
        });
    } catch (err) {
        console.log('video post problem');
        sendERR(err, res);
    }
}