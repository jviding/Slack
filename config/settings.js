// SETTINGS

module.exports = (function () {

	// For production set false
	var DEBUG = true;

	// Port where the app will run
	var PORT = 3000;

	// Database
	var DB = 'mongodb://localhost/slack';

	return {

		DEBUG : DEBUG,
		PORT  : PORT,
		DB    : DB
	
	};

})();