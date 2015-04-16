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
	creatorId: {type: String, index: {unique: true}, required: true},
	score: {type: Number}
});
module.exports = db.model('videoFile', videoFile, 'videoFile'); 
module.exports = db.model('series', series, 'series'); 