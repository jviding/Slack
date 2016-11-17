var Message = require('./models/message');
var Room    = require('./models/room');
//var User    = require('./models/user');

module.exports = function Database (logger) {
	
	// Save a new message to the database
	function saveMessage (message) {
		new Message(message).save(function (err, message) {
			if (err) {
				logger.log('error', 'Database: Couldn\'t save message: '+message);
			} else {
				logger.log('silly', 'Database: Saved message: '+message);
			}
		});
	};

	// Save a new room to the database
	// Data: {user: name, room: name}
	function saveRoom (data) {
		var room = {
			name     : data.room,
		    channels : ['general'],
		    people   : [data.user],
		    admin    : mongoose.Schema.Types.ObjectId,
		    created  : new Date()
		};
	};

	// Save a new channel into a room
	// Data: {room: name, channel: name}
	function saveChannel(data) {
		
	};

	// Add a new user to a room
	// Data: {user: name, room: name}
	function addPeople (data) {
		console.log('supposed to add people');
	};

	// Query a range of messages
	// Data: {room: name, channel: name, range: int}
	function getMessages (data, callback) {
		Message.find({
			room    : data.room,
			channel : data.channel
		}).limit(data.range).exec(function (err, result) {
			if (err) {
				logger.log('error', 'Database: Couldn\'t fetch messages: '+JSON.stringify(data));
				callback('{[]}');
			} else {
				logger.log('silly', 'Database: Fetched '+result.length+' messages: '+JSON.stringify(data));
				callback(JSON.stringify(result));
			}
		});
	};

	// Check if a Room exists
	function roomExists (name) {
		console.log('CHECK IF ROOM EXISTS!');
		return true;
	};

	// Check if a Channel exists in a room
	function channelExists (room, channel) {
		console.log('CHECK IF CHANNEL EXISTS');
		return true;
	};

	// Query all the people belonging into a room
	function getPeople (room, callback) {
		console.log(room);
		callback(JSON.stringify([
			{name: 'matti', id: 1},
			{name: 'keke', id: 2},	
			{name: 'jviding', id: 3},
			{name: 'esko', id: 4}
		]));
	};

	// Query all channels belonging into a room
	function getChannels (room, callback) {
		console.log(room);
		callback(JSON.stringify(['general', 'random', 'trade']));
	};

	return {
		saveMessage   : saveMessage,
		saveRoom      : saveRoom,
		addPeople     : addPeople,
		getMessages   : getMessages,
		roomExists    : roomExists,
		channelExists : channelExists,
		getPeople     : getPeople,
		getChannels   : getChannels
	}
};
