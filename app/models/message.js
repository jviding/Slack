var mongoose = require('mongoose');

var messageSchema = mongoose.Schema({
	sender  : String,
    channel : String,
    message : String,
    room    : String,
    time    : Date
});

// Create the model for users and expose it to our app
module.exports = mongoose.model('Message', messageSchema);