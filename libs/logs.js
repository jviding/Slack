// LOGGING

module.exports = function(DEBUG) {

	// Use Winston for logging
	var winston = require('winston');

	// In development log everything to console
	if (DEBUG === true) {
		var logger = new winston.Logger({
			level: 'silly',
			transports: [new (winston.transports.Console)()]
		});
	} else { 
	// In production log to files
		var logger = new (winston.Logger)({
			transports: [
				new (winston.transports.File)({
					name: 'info',
					filename: __dirname + '/../logs/info.log',
					level: 'info'
				}),
				new (winston.transports.File)({
					name: 'error',
					filename: __dirname + '/../logs/error.log',
					level: 'error'
				})
			]
		});
	}

	logger.log('info', 'Logger successfully started!');

	// Return logger object
	return logger;

	// Usage examples:
	// logger.log('info', 'This is info level message!');
	// logger.log('error', ' This is error level message!');

}