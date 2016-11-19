var mongoose = require('mongoose');

var roomSchema = mongoose.Schema({
	name     : String,
    channels : [String],
    people   : [{type: mongoose.Schema.ObjectId, ref: 'User'}],
    admin    : {type: mongoose.Schema.ObjectId, ref: 'User'},
    created  : Date
});

// Create the model for users and expose it to our app
module.exports = mongoose.model('Room', roomSchema);