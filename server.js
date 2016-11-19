// Load settings
var settings = require('./config/settings');

// Set up logging
var logger = require('./libs/logs')(settings.DEBUG);

// Set up server
var express = require('express');
var session = require('express-session');
var app = express();
var http = require('http').Server(app);

// Connect to database
var mongoose = require('mongoose');
logger.log('info', 'Connecting to database...');
mongoose.Promise = global.Promise;
mongoose.connect(settings.DB);
logger.log('info', 'Connection to database established.');
// Create object to help with database queries
var DBHelper = require('./app/database');
var database = new DBHelper(logger);

// Authentication with passport
var passport = require('passport');
require('./config/passport')(passport);

// Socket.io
var io = require('socket.io')(http);
var socket = require('./app/io')(io, logger, database);

// Load all packages
var fs = require('fs');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// Log Morgan to access.log in production
if (settings.DEBUG === false) {
	var accessLogStream = fs.createWriteStream('./logs/access.log', {flags: 'a'});
	app.use(morgan('combined', {stream: accessLogStream}));
	logger.log('info', 'App running in Production.');
} else {
	// In development log Morgan to console
	app.use(morgan('dev'));
	logger.log('info', '------------------------------------');
	logger.log('info', '| App running in Development mode! |');
	logger.log('info', '------------------------------------');
}

// EJS for templating
app.set('view engine', 'ejs');

// Set public folder for production
if (settings.DEBUG === false) {
	app.use('/static', express.static(__dirname + '/public'));
	app.use('/static', express.static(__dirname + '/bower_components'));
} else {
	// Use the non-compiled scripts and css in development mode
	app.use('/static', express.static(__dirname + '/assets'));
	app.use('/static', express.static(__dirname + '/app'));
	app.use('/static', express.static(__dirname + '/bower_components'));
}

// Configure passport and express
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
	secret : settings.SECRET,
	name   : settings.NAME,
	proxy  : true,
	resave : true,
	saveUninitialized : true
}));
app.use(passport.initialize());
app.use(passport.session());

// Routing
require('./app/routes')(app, logger, database, passport);

// Run server
http.listen(settings.PORT, function () {
	logger.log('info', 'Server listening on port: ' + settings.PORT);
});