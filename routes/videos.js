var mongoose = require("mongoose");
var videoFile = mongoose.model('videoFile');
var series = mongoose.model('series');
var channels = mongoose.model('channel');
var timelines = mongoose.model('timeline');
var timeslots = mongoose.model('timeslot');

function sendERR(err, res) {
    res.send("{ \"message\": \"" + err + "\" }");
}

exports.timelinesGET = function(req, res, next) {
    var id = req.params.id;
    var range = req.query.range || "all";
    var day = req.query.day || "all";

    timelines.find({ //ensure that timelines only appear if they have the specified popularity range and are on the right channel
        $and: [{
            channelId: id
        }, {
            range: range
        }, {
            day: day
        }]
    }).sort({ //sort ascending from upcoming dates
        dateStarted: "1"
    }).exec(function(err, doctimelines) {
        res.send(doctimelines)
    });
}

exports.videoPOST = function(req, res, next) {
    var data = req.body;
    try {
        series.findOne({ //find series
            _id: data.seriesId
        }, function(err, doc) {
            if (!err) {
                var score = doc.score; //get score for series
                var newVideo = new video({ //create new video file object
                    seriesId: data.seriesId,
                    fileName: data.fileName,
                    length: data.lengthOfFile
                });
                channels.findOne({ //find channel that series is on
                    _id: doc.channelId
                }, function(err, docchannel) {
                    if (!err) {
                        (function setTimeSlots(d) {
                            var availableTimeslots = []; //array that will hold ids of available timeslots
                            var range = ceil((doc.score / 100)); //normalize score into rounded up integer from 1-12
                            timelines.find({ //ensure that timelines only appear if they have the specified popularity range and are on the right channel
                                $and: [{
                                    channelId: docchannel._id
                                }, {
                                    range: range
                                }, {
                                    day: d
                                }]
                            }).sort({ //sort ascending from upcoming dates
                                dateStarted: "1"
                            }).exec(function(err, doctimelines) {
                                if (doctimelines.length == 0) { //if there are no timelines yet

                                    var ts = new timeslots({ //create a new timeslot for the file
                                        start: 0,
                                        end: data.lengthOfFile,
                                        filename: data.fileName
                                    });
                                    var date = new Date();
                                    date.setDate(date.getDate() + d);
                                    date.setHours(range * 2);
                                    date.setMinutes(0);
                                    date.setSeconds(0);
                                    date.setMilliseconds(0);
                                    var dayInt = d;
                                    if(dayInt>6){
                                        dayInt = dayInt%7;
                                    }
                                    var newTimeline = new timeline({ //create a new timeline and insert the new timeslot
                                        day: dayInt,
                                        dateStart: date, //TODO need to set this to what makes sense
                                        timeslots: [ts],
                                        channelId: docchannel._id,
                                        range: range
                                    });

                                    newTimeline.save(function(err, savedTimeline) {
                                        availableTimeslots.push(ts._id);
                                        res.send("{ \"Timeline\": "+savedTimeline);

                                    }); //save the new timeslot
                                    
                                } else { //if there are timelines available
                                    for (var i = 0; i < doctimelines.length; i++) { //loop through each timeline for this range

                                        var lastTime = doctimelines[i].timeslots[doctimelines[i].timeslots.length - 1]; //find last time segment available in line
                                        if ((60 - lastTime) > data.lengthOfFile) { //if the show can be inserted into the timeline
                                            var newTimeslot = new timeslots({ //create a new timeslot, insert the show, and append it to the timeslots array
                                                start: lastTime,
                                                end: (lastTime + data.lengthOfFile),
                                                filename: data.fileName
                                            });
                                            //update timeline object with new timeslot
                                            var updatedTimeslot = doctimelines[i].timeslots.push(newTimeslot);
                                            doctimelines[i].timeslots = updatedTimeslot;
                                            doctimelines.save(function(err, savedTimeline) {
                                                res.send("{ \"Timeline\": "+savedTimeline);
                                            
                                            });
                                            availableTimeslots.push(newTimeslot._id); //push available timeslot to arr
                                        }
                                    }
                                    if (availableTimeslots.length == 0) {
                                        setTimeSlots(d + 1);
                                    }
                                }
                            });
                        })();
                    } else {
                        sendERR(err, res);
                    }
                });
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