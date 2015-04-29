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
	seriesId: {type: String},
	length: {type: Number},
	fileName: {type: String},
	episodeName: {type: String}
});
var series = new Schema({
	id: ObjectId,
	dateCreated: {type: Date, default: Date.now},
	channelId: {type: String, required: true},
	userId: {type: String},
	score: {type: Number},
	title: {type: String}
});
var channel = new Schema({
	id: ObjectId,
	dateCreated: {type: Date, default: Date.now},
	channelName: {type: String}
})
var timeslot = new Schema({
	id: ObjectId,
	dateCreated: {type: Date, default: Date.now},
	start: {type : Number},
	end: {type: Number},
	fileId: {type: String}
})
var timeline = new Schema({//2 hour timelines
	id: ObjectId,
	dateCreated: {type: Date, default: Date.now},
	dateStart: {type: Date},
	dateEnd: {type: Date},
	channelId: {type: String},
	range: {type: Number},
	timeslots: [timeslot],
	day: {type: Number}
})
var userSchema = new Schema({
	id: ObjectId,
	dateCreated: {type: Date, default: Date.now},
	firstName: {type: String},
	lastName: {type: String},
	email: {type: String, index: { unique: true }, required: true},
	username: {type: String, index: { unique: true }, required: true},
	password: {type: String, required: true},
	gravatar: {type: String},
	avatar: {type: String},
	typeOfAccount: {type: Number, default: 0} //type of account will be an int, 1 for creator, 0 for streamer
})
module.exports = db.model('videoFile', videoFile, 'videoFile'); 
module.exports = db.model('series', series, 'series'); 
module.exports = db.model('channel', channel, 'channel'); 
module.exports = db.model('timeslot', timeslot, 'timeslot'); 
module.exports = db.model('timeline', timeline, 'timeline');
module.exports = db.model('users', userSchema,'users');