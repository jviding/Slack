module.exports = function (app, logger, database) {

	// Home page, the default view
	app.get('/', function (req, res) {
		res.render('index.ejs', {template: 'frontpage'});
	});

	// Redirect traffic to /:room/message/general as general is the default channel inside a room
	app.get('/message/:room', function (req, res) { res.redirect('/message/'+req.params.room+'/general'); });
	app.get('/message/:room', function (req, res) {	res.render('/message/'+req.params.room+'/general'); });
	app.get('/message/:room/:channel', function (req, res) {
		// If room doesn't exist, redirect to home page
		if (!database.roomExists(req.params.room)) {
			res.redirect('/');
		} else if (req.params.channel !== 'general' && !database.channelExists(req.params.room, req.params.channel)) {
			// If room exists, but the channel doesn't, open the general channel
			res.redirect('/message/'+req.params.room+'/general');
		} else {
			// Both room and channel exist, proceed
			res.render('index.ejs', {user: 'jviding', template: 'chatroom'});
		}
	});

	// Request for channels of a room
	app.get('/api/:room/channels', function (req, res) {
		database.getChannels(req.params.room, function (data) {
			res.json('{"channels":'+data+'}');
		});
	});

	// Request for people in a room
	app.get('/api/:room/people', function (req, res) {
		database.getPeople(req.params.room, function (data) {
			res.json('{"people":'+data+'}');
		});
	});

	// Request for messages on a channel
	app.get('/api/:room/:channel/:range', function (req, res) {

		console.log('REMEMBER @ IF ITS A PERSON!');

		var request = {room: req.params.room, channel: req.params.channel, range: req.params.range};
		database.getMessages(request, function (data) {
			res.json('{"messages":'+data+'}');
		});
	});

	// Create a new channel
	app.post('/api/:room/channels/:channel', function (req, res) {
		logger.log('info', 'New channel \''+data.channel+'\' in room \''+data.room+'\'.');
	});

	// Add a new member to a room
	app.post('/api/:room/people/:user', function (req, res) {
		logger.log('info', 'User \''+data.user+'\' joined \''+data.room+'\'.');
	});

	// Requested URL didn't match anything, go to home page
	app.use('*', function (req, res) {
		res.redirect('/');
	});

};