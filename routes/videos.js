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
  var currentTime = Date.now;
  var query, home; // query for aggregation, home is to tell if it was requested for viewing
  var id = req.params.id;
  var next = req.query.next; //value is true not undefined
  var nextTimeLine = req.query.ntl || 0; //index for next timeline (not built yet)
  var nextTimeSlot = req.query.nts || 0; //index for next timeslot (built)
  var range = req.query.range || "all"; // if not queried default to all
  var day = req.query.day || "all"; // if not queried default to all

  if (range == "all" || day == "all") {
    home = true;
    // get the timeline between 
    query = { 
      $and: [{
        channelId: id
      },{ 
        dateStart: { $lt: currentTime } 
      }, {
        dateEnd: { $gt: currentTime } // Added to schema.js and node-backend
      }]
    };
  } else if (next == true) {
    home = true;
    // for get next timeline we get all channels and work from there
    query = {
      channelId: id
    };
  } else {
    home = false;
    query = { //ensure that timelines only appear if they have the specified popularity range and are on the right channel
      $and: [{
        channelId: id
      }, {
        range: range
      }, {
        day: day
      }]
    };
  }

  timelines.find(query).sort({ //sort ascending from upcoming dates
    dateStarted: "1"
  }).exec(function(err, doctimelines) {
    if (err) res.sendERR(err, res);
    if (home) {
      if (doctimelines.length == 1)  { //should only get one timeline if calculations done right
        if (next) { // requesting next timeslot once done the current one
          var timeslot = doctimelines[0].timeslots[nextTimeSlot]
          //sending ts_index to maintain the index of the timeslots and add 1 on the frontend, subsequently requesting the next timeslot
          res.send("{ \"message\": \"Success\", \"tl_index\": "+0+", \"ts_index\": "+nextTimeSlot+", \"fileId\": \""+timeslot.fileId+"\", \"start\": "+timeslot.start+" }")
        } else {
          var timeslots = doctimelines[0].timeslots;
          for (var i=0; i<timeslots.length; i++) { //loop through timeslots (hopefully I can make the aggregation query better so this isn't needed)
            
            var startTime = doctimelines[0].dateStart;

            //check if current time is between the requested timeslots
            if (currentTime > startTime.setMinutes(startTime.getMinutes()+timeslots[i].start) && currentTime < startTime.setMinutes(startTime.getMinutes()+timeslots[i].end)) {
              // get when the video should be requested
              var videoStart =  (currentTime.getTime() - startTime.setMinutes(startTime.getMinutes()+timeslots[i].start).getTime())/6000; //video start in minutes

              //send file name back with start time (render video element with start time)
              //built to get next timeslot but not next timeline
              res.send("{ \"message\": \"Success\", \"tl_index\": "+0+", \"ts_index\": "+i+", \"fileId\": \""+timeslots[i].fileId+"\", \"start\": "+videoStart+" }")
            } else {
              res.send("{ \"message\": \"Error: can't find matching timeslot\" }")
            }
          }  
        }
        
      }
    } else {
      // if not requesting from home page (or simply the normal request), just send back some timelines
      res.send(doctimelines)
    }
   
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
        console.log('seriesId: ', data.seriesId)
        console.log('doc: ', doc)
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
                console.log('running set timeslots');
                var availableTimeslots = []; //array that will hold ids of available timeslots
                if (range >= 1) {
                  if (d == 14) { //check if two weeks in advance
                    d = 0;
                    range = range - 1;
                  }
                  console.log('got to d less than 14 and range more than 1');
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
                      if ((date.getDay() == 0) || (date.getDay() == 6)) {
                        date.setHours((rangeLookupTableWKD[range]) * 2);
                      } else {
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
                        res.send("{ \"Timeline id\": " + newTimeline._id + "}");

                      }); //save the new timeslot
                    } else { //if there are timelines available
                      for (var i = 0; i < doctimelines.length; i++) { //loop through each timeline for this range

                        var lastTime = (doctimelines[i].timeslots[doctimelines[i].timeslots.length - 1]).end; //find last time segment available in line
                        console.log('last time: ' + lastTime);
                        if ((120 - lastTime) > data.lengthOfFile) { //if the show can be inserted into the timeline
                          var newTimeslot = new timeslots({ //create a new timeslot, insert the show, and append it to the timeslots array
                            start: lastTime,
                            end: (parseFloat(lastTime) + parseFloat(data.lengthOfFile)),
                            fileId: newVideo._id
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
                                res.send("{ \"Timeline\": " + model._id + "}");
                              else
                                console.log(err);
                            }
                          );
                          availableTimeslots.push(newTimeslot._id); //push available timeslot to arr
                        } else {
                          console.log('last time: ', lastTime);
                          console.log('length of file: ', data.lengthOfFile);
                          if (((120 - lastTime) > (data.lengthOfFile / 3) && data.lengthOfFile > 10) || (data.lengthOfFile < 10)) {
                            var date = new Date();
                            if ((date.getDay() == 0) || (date.getDay() == 6)) {
                              var nextRangeTimeline = rangeLookupTableWKD.indexOf(rangeLookupTableWKD[range] + 1);
                            } else {
                              var nextRangeTimeline = rangeLookupTableWK.indexOf(rangeLookupTableWK[range] + 1);
                            }
                            timelines.find({ //ensure that timelines only appear if they have the specified popularity range and are on the right channel
                              $and: [{
                                channelId: docchannel._id
                              }, {
                                range: nextRangeTimeline
                              }, {
                                day: d
                              }]
                            }).sort({ //sort ascending from upcoming dates
                              dateStarted: "1"
                            }).exec(function(err, doctimelines2) {
                              if (doctimelines2.length == 0) {
                                var newTimeslotCurrent = new timeslots({ //create a new timeslot, insert the show, and append it to the timeslots array
                                  start: lastTime,
                                  end: 120,
                                  fileId: newVideo._id
                                });
                                console.log("index: "+i)
                                timelines.findByIdAndUpdate(
                                  doctimelines[0]._id, {
                                    $push: {
                                      "timeslots": newTimeslotCurrent
                                    }
                                  }, {
                                    safe: true,
                                    upsert: true
                                  },
                                  function(err, model) {
                                    if (!err) {
                                      var ts = new timeslots({ //create a new timeslot for the file
                                        start: 0,
                                        end: data.lengthOfFile - (120 - lastTime),
                                        fileId: newVideo._id
                                      });
                                      var newDate = new Date();
                                      newDate.setDate(newDate.getDate() + d);
                                      if ((newDate.getDay() == 0) || (newDate.getDay() == 6)) {
                                        newDate.setHours((rangeLookupTableWKD[nextRangeTimeline]) * 2);
                                      } else {
                                        newDate.setHours((rangeLookupTableWK[nextRangeTimeline]) * 2);
                                      }
                                      newDate.setMinutes(0);
                                      newDate.setSeconds(0);
                                      var dayInt = d;
                                      if (dayInt > 6) {
                                        dayInt = dayInt % 7;
                                      }
                                      console.log('Date' + newDate);
                                      var newTimeline = new timelines({ //create a new timeline and insert the new timeslot
                                        day: dayInt,
                                        dateStart: newDate, //TODO need to set this to what makes sense
                                        dateEnd: newDate.setHours(newDate.getHours()+2),
                                        timeslots: [ts],
                                        channelId: docchannel._id,
                                        range: nextRangeTimeline
                                      });
                                      newTimeline.save(function(err) {
                                        if (err) {
                                          console.log(err);
                                        }
                                        availableTimeslots.push(ts._id);
                                        res.send("{ \"Timeline id\": " + newTimeline._id + "}");

                                      }); //save the new timeslot
                                    } else console.log(err);
                                  }
                                );
                              } else {
                                setTimeSlots(d + 1);
                              }
                            });
                          } else {
                            setTimeSlots(d + 1) 
                          }
                        }
                      }

                    }
                  });
                } else {
                  res.send("No available timeslots");
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