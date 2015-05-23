var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoose = require("mongoose");
var schema = require("./schema");
var routes = require('./routes/index');
var videos = require('./routes/videos');
var series = require('./routes/series');
var channels = require('./routes/channels');
var users = require('./routes/users');
var amas = require('./routes/amas');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ resave: true,
                  saveUninitialized: true,
                  secret: 'fybriseverything' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/timelines/:id', videos.timelinesGET)
app.post('/videos',videos.videoPOST)
app.post('/series',series.seriesPOST)
app.get('/series',series.seriesGET)
app.get('/series/userId/:id',series.seriesUserIdGET)
app.post('/channels', channels.channelsPOST);
app.get('/channels', channels.channelsGET);
app.get('/channels/:id',channels.channelsGET);

app.post('/questions', amas.questionsPOST);
app.post('/questionsUpdate', amas.questionsUPDATE);
app.delete('/questions/:id', amas.questionsDELETE);
app.get('/questionsGETS/:id', amas.questionsGETSID);
app.get('/questionsGETU/:id', amas.questionsGETUID);
app.get('/questions/:id',amas.questionsGET);

app.post('/users',users.usersPOST);
app.get('/users/:id',users.usersIdGET);
app.delete('/users/:id',users.usersIdDELETE);
app.post('/users/auth',users.usersAUTH);
app.post('/users/:id',users.usersIdPOST);
app.post('/users/logout',users.usersLogout);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
var server = app.listen(5000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Fybr server at http://%s:%s', host, port);
  //addToTimeline(83,'553c4755594c6adaa7ad79e3');
})
var addToTimeline = function(minutesToAdd,cid){
  var videoFile = mongoose.model('videoFile');
  var series = mongoose.model('series');
  var channels = mongoose.model('channel');
  var timelines = mongoose.model('timeline');
  var timeslots = mongoose.model('timeslot');
  var currentTime = new Date(Date.now());
query = {
    $and: [{
        channelId: cid
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
        var lastTime = (doctimelines[0].timeslots[doctimelines[0].timeslots.length - 1]).end;
            var newTimeslotCurrent = new timeslots({ //create a new timeslot, insert the show, and append it to the timeslots array
                start: lastTime,
                end: minutesToAdd+lastTime,
                fileId: ''
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
                  if(!err) console.log('pushed timeslot');
                }
            )
        })
}