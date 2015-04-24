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
    var rangeLookupTableWKD = new Array();
    rangeLookupTableWKD[1] = 2;
    rangeLookupTableWKD[2] = 3;
    rangeLookupTableWKD[3] = 1;
    rangeLookupTableWKD[4] = 8;
    rangeLookupTableWKD[5] = 7;
    rangeLookupTableWKD[6] = 9;
    rangeLookupTableWKD[7] = 4;
    rangeLookupTableWKD[8] = 0;
    rangeLookupTableWKD[9] = 6;
    rangeLookupTableWKD[10] = 5;
    rangeLookupTableWKD[11] = 11;
    rangeLookupTableWKD[12] = 10;
    var rangeLookupTableWK = new Array();
    rangeLookupTableWK[1] = 3;
    rangeLookupTableWK[2] = 2;
    rangeLookupTableWK[3] = 1;
    rangeLookupTableWK[4] = 4;
    rangeLookupTableWK[5] = 7;
    rangeLookupTableWK[6] = 5;
    rangeLookupTableWK[7] = 6;
    rangeLookupTableWK[8] = 8;
    rangeLookupTableWK[9] = 0;
    rangeLookupTableWK[10] = 9;
    rangeLookupTableWK[11] = 11;
    rangeLookupTableWK[12] = 10;
    try {
        series.findOne({ //find series
            _id: data.seriesId
        }, function(err, doc) {
            if (!err) {
                var score = doc.score; //get score for series
                var newVideo = new videoFile({ //create new video file object
                    seriesId: data.seriesId,
                    fileName: data.fileName,
                    length: data.lengthOfFile,
                    episodeName: data.episodeName 
                });
                var range = Math.ceil((score / 100)); //normalize score into rounded up integer from 1-12
                newVideo.save(function(err) {
                    channels.findOne({ //find channel that series is on
                        _id: doc.channelId
                    }, function(err, docchannel) {
                        if (!err) {
                            (function setTimeSlots(d) {
                                var availableTimeslots = []; //array that will hold ids of available timeslots
                                if ((d == 14) && (range > 1)) { //check if two weeks in advance and range is still real
                                    d = 0;
                                    range - 1;
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
                                                fileId: newVideo._id
                                            });
                                            var date = new Date();
                                            date.setDate(date.getDate() + d);
                                            if((date.getDay() == 0) || (date.getDay() == 6)){
                                                date.setHours((rangeLookupTableWKD[range]) * 2);
                                            }
                                            else{
                                                date.setHours((rangeLookupTableWK[range]) * 2);
                                            }
                                            date.setMinutes(0);
                                            date.setSeconds(0);
                                            var dayInt = d;
                                            if (dayInt > 6) {
                                                dayInt = dayInt % 7;
                                            }
                                            var newTimeline = new timelines({ //create a new timeline and insert the new timeslot
                                                day: dayInt,
                                                dateStart: date, //TODO need to set this to what makes sense
                                                timeslots: [ts],
                                                channelId: docchannel._id,
                                                range: range
                                            });
                                            newTimeline.save(function(err) {
                                                if (err) {
                                                    console.log(err);
                                                }
                                                availableTimeslots.push(ts._id);
                                                res.send("{ \"Timeline id\": " + newTimeline._id);

                                            }); //save the new timeslot
                                        } else { //if there are timelines available
                                            for (var i = 0; i < doctimelines.length; i++) { //loop through each timeline for this range

                                                var lastTime = (doctimelines[i].timeslots[doctimelines[i].timeslots.length - 1]).end; //find last time segment available in line
                                                console.log('last time: ' + lastTime);
                                                if ((60 - lastTime) > data.lengthOfFile) { //if the show can be inserted into the timeline
                                                    var newTimeslot = new timeslots({ //create a new timeslot, insert the show, and append it to the timeslots array
                                                        start: lastTime,
                                                        end: (parseInt(lastTime) + parseInt(data.lengthOfFile)),
                                                        filename: data.fileName
                                                    });
                                                    //update timeline object with new timeslot
                                                    var updatedTimeslot = doctimelines[i].timeslots.push(newTimeslot);
                                                    doctimelines[i].timeslots = updatedTimeslot;
                                                    timelines.findByIdAndUpdate(
                                                        doctimelines[i]._id, {
                                                            $push: {
                                                                "timeslots": newTimeslot
                                                            }
                                                        }, {
                                                            safe: true,
                                                            upsert: true
                                                        },
                                                        function(err, model) {
                                                            if (!err)
                                                                res.send("{ \"Timeline\": " + model._id);
                                                            else
                                                                console.log(err);
                                                        }
                                                    );
                                                    availableTimeslots.push(newTimeslot._id); //push available timeslot to arr
                                                }
                                            }
                                            if (availableTimeslots.length == 0) {
                                                setTimeSlots(d + 1);
                                            }
                                        }
                                    });
                                } else if (range < 1) {
                                    res.send("{ \"No available slots for any range in the next two weeks\"");
                                }
                            })(0);
                        } else {
                            sendERR(err, res);
                        }
                    });
                });
            } else {
                sendERR(err, res);
            }
        });
    } catch (err) {
        console.log('video post problem');
        sendERR(err, res);
    }
}