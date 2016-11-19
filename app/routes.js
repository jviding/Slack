module.exports = function (app, logger, database, passport) {

	// DEFAULT
	app.get('/', isLoggedIn, function (req, res) {
		// Login page if not logged in yet, otherwise home page
		res.redirect('/home');
	});

	// LOGIN
	app.get('/login', notLoggedIn, function (req, res) {
		// If user is already logged in, go to default page
		res.render('index.ejs', {template: 'login'});
	});

	// LOGOUT
	app.get('/logout', isLoggedIn, function (req, res) {
		// If user is not logged in, go to default page, otherwise log out
		req.logout();
		logger.log('info', 'Passport: User '+req.user+' has logged out.'); 
		res.redirect('/');
	});

	// HOME
	app.get('/home', isLoggedIn, function (req, res) {
		// If user is not logged in redirect to login page
		res.render('index.ejs', {template: 'home'})
	});

	// SIGNUP
	app.post('/signup', notLoggedIn, function (req, res, next) {
		// Use passport for validating the Sign up request
		passport.authenticate('local-signup', function (err, user, info) {
			if (err) {
				logger.log('error', 'Passport: Sign up: '+err.name+' '+err.message); 
				return res.status(500).send({ error: info }); 
			}
			if (!user) { 
				logger.log('info', 'Passport: Sign up failed for username \''+req.body.username+'\': '+info);
				return res.status(500).send({ error: info }); }
			// User created, try logging in
			req.logIn(user, function (err) {
				if (err) { return res.status(500); }
				// New user successfully created and logged in
				logger.log('info', 'Passport: User '+user.local.username+' has logged in.'); 
				return res.status(201).send({ redirect: '/home' });
			});
		})(req, res, next);
	});

	// LOGIN
	app.post('/login', notLoggedIn, function (req, res, next) {
		// Use passport for validating the Login request
		passport.authenticate('local-login', function (err, user, info) {
			if (err) {
				logger.log('error', 'Passport: Login: '+err.name+' '+err.message); 
				return res.status(500).send({ error: info }); 
			}
			if (!user) { 
				logger.log('info', 'Passport: Login failed for username \''+req.body.username+'\': '+info);
				return res.status(500).send({ error: info }); }
			// Credentials correct and user object found, log user in
			req.logIn(user, function (err) {
				if (err) { return res.status(500); }
				// User successfully logged in
				logger.log('info', 'Passport: User '+user.local.username+' has logged in.'); 
				return res.status(200).send({ redirect: '/home' });
			});
		})(req, res, next);
	});

	// CHATROOM

	// Open general channel as a default if no channel provided
	app.get('/message/:room', isLoggedIn, function (req, res) { res.redirect('/message/'+req.params.room+'/general'); });
	app.get('/message/:room/:channel', isLoggedIn, function (req, res) {
		database.joinRoomAndChannel(req.params.room, req.params.channel, req.user, function (room, channel, roomId) {
			if (room && channel) {
				// Both room and channel (might be a person) are correct
				res.render('index.ejs', {user: req.user, room: {_id: roomId}, template: 'chatroom'});
			} else if (room && !channel) {
				// When room exists but it doesn't have the requested channel, go to general
				res.redirect('/message/'+req.params.room+'/general');
			} else {
				// Room doesn't exist
				res.redirect('/');
			}
		});
	});

	// CHATROOM API

	// Create a new room
	app.post('/api/room/:room', isAuthorized, function (req, res) {
		database.saveRoom(req.user, req.params.room, function (created, info) {
			if (created) {
				res.status(201).send({ success: true, redirect: '/message/'+req.params.room+'/general' });
			} else {
				res.status(500).send({ success: false, error: info });
			}
		});
	});

	// Get all rooms
	app.get('/api/rooms', isAuthorized, function (req, res) {
		database.getRooms(req.user, function (data, message) {
			if (data) {
				res.json('{"rooms":'+data+'}')
			} else {
				res.status(500).send({ error: message });
			}
		});
	});

	// Get rooms by user
	app.get('/api/myrooms', isAuthorized, function (req, res) {
		database.getRoomsByUser(req.user, function (data, message) {
			if (data) {
				res.json('{"rooms":'+data+'}')
			} else {
				res.status(500).send({ error: message });
			}
		});
	});

	// User joins a room
	app.post('/api/join/:roomId', isAuthorized, function (req, res) {
		database.addUserToRoom(req.user, req.params.roomId, function (success, message, room) {
			if (success) {
				res.status(200).send({message: message, redirect: '/message/'+room+'/general'});
			} else {
				res.status(500).send({error: message});
			}
		});
	});

	// User leaves a room
	app.post('/api/leave/:roomId', isAuthorized, function (req, res) {
		database.removeUserFromRoom(req.user, req.params.roomId, function (success, message) {
			if (success) {
				res.status(200).send({message: message});
			} else {
				res.status(500).send({error: message});
			}
		});
	});

	// Request for channels of a room
	app.get('/api/channels/:room', function (req, res) {
		database.getChannelsByRoomId(req.params.room, function (data) {
			res.json('{"channels":'+data+'}');
		});
	});

	// Request for people in a room
	app.get('/api/people/:room', function (req, res) {
		database.getPeopleByRoomId(req.params.room, function (data) {
			res.json('{"people":'+data+'}');
		});
	});

	// Create a new channel
	app.post('/api/channels/:room/:channel', function (req, res) {
		database.addChannelToRoom(req.params.room, req.params.channel, function (success, message) {
			if (success) {
				res.status(200).send({message: message});
			} else {
				res.status(500).send({error: message});
			}
		});
	});

	// Request for messages on a channel
	app.get('/api/messages/:roomId/:channel/:range?', function (req, res) {
		// Range is an optional parameter that defaults to 100
		var range = (req.params.range ? req.params.range : 100);
		if (req.params.channel.length>0 && req.params.channel.charAt(0) === '@') {
			database.getPrivateMessages(req.params.roomId, req.user.local.username, req.params.channel.slice(1), range, function (result) {
				res.json('{"messages":'+result+'}');
			});
		} else {
			database.getChannelMessages(req.params.roomId, req.params.channel, range, function (result) {
				res.json('{"messages":'+result+'}');
			});
		}
	});

	// Requested URL didn't match anything, go to default page
	app.use('*', function (req, res) {
		res.redirect('/');
	});

	// ROUTE MIDDLEWARE

	// Check user is logger in
	function isLoggedIn(req, res, next) {
		// If logged in, continue
		if (req.isAuthenticated()) {
			return next();
		}
		// If user isn't logged in, redirect to login page
		res.redirect('/login');
	};

	// Check that user is not logged in
	function notLoggedIn(req, res, next) {
		// If not logged in, continue
		if (!req.isAuthenticated()) {
			return next();
		}
		// If user is logged in, go to default page
		res.redirect('/');
	};

	// Check that user is logged in and return access codes
	function isAuthorized(req, res, next) {
		// If logged in, continue
		if (req.isAuthenticated()) {
			return next();
		}
		// Else return permission denied
		res.status(401).send({error: 'Permission denied!'});
	};

};