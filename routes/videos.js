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
        series.findOne({ //find series
            _id: data.seriesId
        }, function(err, doc) {
            if (!err) {
                var score = doc.score;//get score for series
                var newVideo = new video({//create new video file object
                    seriesId: data.seriesId,
                    fileName: data.fileName,
                    length: data.lengthOfFile
                });
                channels.findOne({//find channel that series is on
                        _id: doc.channelId
                    }, function(err, docchannel) {
                        if (!err) {
                            var availableTimeslots = [];//array that will hold ids of available timeslots
                            var range = ceil((doc.score / 100));//normalize score into rounded up integer from 1-12
                            timelines.find({ //ensure that timelines only appear if they have the specified popularity range and are on the right channel
                                $and: [{
                                    channelId: docchannel._id
                                }, {
                                    range: range
                                }]
                            }).sort({//sort ascending from upcoming dates
                                dateStarted: "1"
                            }).exec(function(err, doctimelines) {
                                    if (doctimelines.length == 0) {//if there are no timelines yet

                                        var ts = new timeslots({//create a new timeslot for the file
                                            start: 0,
                                            end: data.lengthOfFile,
                                            filename: data.fileName
                                        });
                                        var newTimeline = new timeline({//create a new timeline and insert the new timeslot
                                            dateStart: Date.now,
                                            timeslots: [ts],
                                            channelId: docchannel._id,
                                            range: range
                                        });

                                        newTimeline.save();//save the new timeslot
                                        availableTimeslots.pust(ts._id);
                                    } else {//if there are timelines available
                                        for (var i = 0; i < doctimelines.length; i++) { //loop through each timeline for this range

                                            var lastTime = doctimelines[i].timeslots[doctimelines[i].timeslots.length - 1];//find last time segment available in line
                                            if ((60 - lastTime) > data.lengthOfFile) {//if the show can be inserted into the timeline
                                                var newTimeslot = new timeslots({//create a new timeslot, insert the show, and append it to the timeslots array
                                                    start: lastTime,
                                                    end: (lastTime + data.lengthOfFile),
                                                    filename: data.fileName
                                                });
                                                //update timeline object with new timeslot
                                                var updatedTimeslot = doctimelines[i].timeslots.push(newTimeslot);
                                                doctimelines[i].timeslots = updatedTimeslot;
                                                doctimelines.save();
                                                availableTimeslots.pust(newTimeslot._id);//push available timeslot to arr
                                            }
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