var LocalStrategy = require('passport-local').Strategy;
var User = require('../app/models/user');

module.exports = function(passport) {

	// For serializing the user for the session
	passport.serializeUser(function (user, done) {
		done(null, user.id);
	});

	// For deserializing the user
	passport.deserializeUser(function (id, done) {
		User.findById(id, function (err, user) {
			done(err, user);
		});
	});


	//LOCAL SIGNUP
	passport.use('local-signup', new LocalStrategy({
			usernameField : 'username',
			passwordField : 'password',
			passReqToCallback : true
		},
		function(req, username, password, done) {
			process.nextTick(function () {
				// Validate username and password length
				if (username.length < 4 || username.length > 15) {
					return done(null, false, 'Username has to be 4 - 15 characters!');
				} else if (password.length < 6 || password.length > 20) {
					return done(null, false, 'Password has to be 6 - 20 characters!');
				} else if (!/^([a-zA-Z0-9]*)$/.test(username)) {
					return done(null, false, 'Username contains illegal characters!');
				}
				// Username and password ok, try to create a new user
				User.findOne({'local.username' : username}, function (err, user) {
					if (err) {
						return done(err, false, 'Something went wrong!');
					}
					if (user) {
						// Username already taken
						return done(null, false, 'Username already taken!');
					}
					else {
						// Create new user
						var newUser = new User();
						newUser.local.username = username;
						newUser.local.password = newUser.generateHash(password);
						newUser.save(function (err) {
							if (err) {
								throw err;
							}
							// Return new created user
							return done(null, newUser, 'User successfully created!');
						});
					}
				});
			});
		})
	);

	//LOCAL LOGIN
	passport.use('local-login', new LocalStrategy({
			usernameField : 'username',
			passwordField : 'password',
			passReqToCallback : true
		},
		function(req, username, password, done) {
			process.nextTick(function () {
				User.findOne({'local.username' : username}, function (err, user) {
					if (err) {
						return done(err, false, 'Something went wrong!');
					}
					if (!user) {
						// No user found with the username
						return done(null, false ,'Incorrect username or password!');
					}
					if (!user.validPassword(password)) {
						// Incorrect password for the username
						return done(null, false, 'Incorrect username or password!');
					}
					// Both username and password correct
					return done(null, user, 'Login successfull!');
				});
			});
		})
	);

};