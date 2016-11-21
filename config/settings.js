// SETTINGS

module.exports = (function () {

	// For production set false
	var DEBUG = true;
	// Note the <script src="//localhost:35729/livereload.js"></script> used in development
	// Remove it from index.ejs when deploying for production

	// Port where the app will run
	var PORT = 3000;

	// Database
	var DB = 'mongodb://localhost/slack';

	// Secret salt for production
	var SECRET = 'change_me_for_production';
	
	// The name of the app - used in cookies (not important)
	var NAME = 'Slack';

	// Google captcha
	var CAPTCHA = '';

	return {

		DEBUG : DEBUG,
		PORT  : PORT,
		DB    : DB,
		SECRET: SECRET,
		NAME  : NAME,
		CAPTCHA : CAPTCHA
	
	};

})();