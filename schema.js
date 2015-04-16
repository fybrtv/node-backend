var mongoose = require('mongoose')
,Schema = mongoose.Schema
,ObjectId = Schema.ObjectId;
 
var db_url = process.env.MONGOHQ_URL || "mongodb://localhost:27017/Fybr",
db = mongoose.connect(db_url);
conn = mongoose.connection
conn.on('error', console.error.bind(console, 'connection error:'));

var videoFile = new Schema({
	id: ObjectId,
	dateCreated: {type: Date, default: Date.now},
	seriesId: {type: String, index: { unique: true }, required: true},
	length: {type: Number},
	fileName: {type: String}
});
var series = new Schema({
	id: ObjectId,
	dateCreated: {type: Date, default: Date.now},
	creatorId: {type: String, required: true},
	channelId: {type: String, required: true},
	score: {type: Number}
});
var channel = new Schema({
	id: ObjectId,
	dateCreated: {type: Date, default: Date.now},
	name: {type: Number}
})
var timeslot = new Schema({
	id: ObjectId,
	dateCreated: {type: Date, default: Date.now},
	start: {type : Number},
	end: {type: Number},
	fileId: {type: String, required: true}
})
var timeline = new Schema({//2 hour timelines
	id: ObjectId,
	dateCreated: {type: Date, default: Date.now},
	dateStart: {type: Date},
	channelId: {type: String},
	range: {type: Number},
	timeslots: [timeslot],
	day: {type: Number}
})
module.exports = db.model('videoFile', videoFile, 'videoFile'); 
module.exports = db.model('series', series, 'series'); 
module.exports = db.model('channel', channel, 'channel'); 
module.exports = db.model('timeslot', timeslot, 'timeslot'); 
module.exports = db.model('timeline', timeline, 'timeline');