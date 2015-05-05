

var currentTime = new Date(Date.now());
query = {
    $and: [{
        channelId: id
    }, {
        dateStart: {
            $lt: currentTime
        }
    }, {
        dateEnd: {
            $gt: currentTime
        } // Added to schema.js and node-backend
    }]
};
timelines.find(query).sort({ //sort ascending from upcoming dates
        dateStarted: "1"
    }).exec(function(err, doctimelines) {
            var newTimeslotCurrent = new timeslots({ //create a new timeslot, insert the show, and append it to the timeslots array
                start: lastTime,
                end: 120,
                fileId: newVideo.fileId
            });
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

                }
            )
        })