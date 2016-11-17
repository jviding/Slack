var mongoose = require('mongoose');

var roomSchema = mongoose.Schema({
	name     : String,
    channels : [String],
    people   : [mongoose.Schema.Types.ObjectId],
    admin    : mongoose.Schema.Types.ObjectId,
    created  : Date
});

// Create the model for users and expose it to our app
module.exports = mongoose.model('Room', roomSchema);