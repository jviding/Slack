module.exports = function (io, logger, database) {

	io.on('connection', function (socket) {
		// New user has opened a socket
		logger.log('info', 'User connected.');

		// User joins a room
		socket.on('join room', function (data) {
			socket.join(data.room);
			// Trigger all to reload people if user missing from the list
			socket.to(data.room).emit('new user', data.user);
		});

		// A new channel created in a room
		socket.on('new channel', function (room) {
			// Trigger all to reload channels
			socket.to(room).emit('new channel');
		});
		
		// A new message sent to a channel in a room
		socket.on('new message', function (data) {
			// Store message to database
			database.saveMessage(data);
			// Send message to other clients
			socket.to(data.room).emit('new message', data);
		});

		// A user has disconnected
		socket.on('disconnect', function () {
			logger.log('info', 'User has disconnected.');
		});

	});
};