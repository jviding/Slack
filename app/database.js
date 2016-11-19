var Message = require('./models/message');
var Room    = require('./models/room');
//var User    = require('./models/user');

module.exports = function Database (logger) {
	
	// Save a new message to the database
	function saveMessage (message) {
		new Message(message).save(function (err, message) {
			if (err) {
				logger.log('error', 'Database: Couldn\'t save message: '+message);
			} else {
				logger.log('silly', 'Database: Saved message: '+message);
			}
		});
	};

	// Save a new room to the database
	// Data: {user: name, room: name}
	function saveRoom (user, room, done) {
		// Check name length
		if (room.length < 3 || room.length > 20) {
			return done(false, 'Room name should be 3 - 20 characters!');
		} else {
			// Check for unique name
			findRoomObjectByName(room, function (result) {
				if (result) {
					// Room with the name already exists
					logger.log('silly', 'Database: Failed to create room. Duplicate name: '+room);
					return done(false, 'Room with the name \''+room+'\' already exists!');
				} else {
					// Create a New room object
					var newRoom = {
						name     : room,
					    channels : ['general'], // Add general as the default channel
					    people   : [user._id],
					    admin    : user._id,
					    created  : new Date()
					};
					// And then save it
					createNewRoomObject(newRoom, function (success) {
						if (!success) {
							return done(false, 'Something went wrong!');
						} else {
							logger.log('info', 'Database: New room created: '+room);
							return done(true, 'Room successfully created!');
						}
					});
				}
			});
		}
	};

	// Get all rooms where user is not a member
	function getRooms (user, done) {
		Room.find({people: {$ne: user._id}}).populate('people').exec(function (err, result) {
			if (err) {
				logger.log('error', 'Database: Failed loading all rooms.');
				return done(false, 'Something went wrong!');
			} else {
				logger.log('silly', 'Database: Fetched '+result.length+' rooms.');
				return done(JSON.stringify(result));
			}
		});
	};

	// Get rooms user belongs to
	function getRoomsByUser (user, done) {
		Room.find({people: user._id}).exec(function (err, result) {
			if (err) {
				logger.log('error', 'Database: Failed loading rooms by user id: '+user._id);
				return done(false, 'Something went wrong!');
			} else {
				logger.log('silly', 'Database: Fetched '+result.length+' rooms for user '+user._id+'.');
				return done(JSON.stringify(result));
			}
		});
	};

	// Add User into a Room
	function addUserToRoom (user, room, done) {
		findRoomObjectById(room, function (result) {
			if (!result) {
				logger.log('info', 'Database: Failed adding: '+user._id+' to room: '+room+'. Room not found.');
				return done(false, 'Something went wrong!', false);
			} else {
				userBelongsToRoomObject(user, result, function (inRoom) {
					if (!inRoom) {
						// User is not in the room yet, let's add it
						result.people.push(user._id);
						saveRoomObject(result, function (success) {
							if (!success) {
								return done(false, 'Something went wrong!', false);
							} else {
								logger.log('info', 'Database: User '+user._id+' joined room: '+room);
								return done(true, 'Successfully joined the room!', result.name);
							}
						});
					} else {
						// User is already in the room
						logger.log('info', 'Database: Failed to add user '+user._id+' to room '+room+'. User already a member of it!');
						return done(false, 'You are already a member of this room!', false);
					}
				});
			}
		});
	};

	// Remove user from a room
	function removeUserFromRoom (user, room, done) {
		findRoomObjectById(room, function (result) {
			if (!result) {
				logger.log('info', 'Database: Failed removing user: '+user._id+' from room: '+room+'. Room not found.');
				return done(false, 'Something went wrong!');
			} else {
				userBelongsToRoomObject(user, result, function (inRoom, index) {
					if (!inRoom) {
						// User is not a member of the room
						logger.log('info', 'Database: Failed to remove user '+user._id+' from room '+room+'. User not a member!');
						return done(false, 'You are not a member of this room!');
					} else {
						// User is in the room. If leaving as the last member, remove whole room
						if (result.people.length === 1) {
							deleteRoomObject(result, function (success) {
								if (!success) {
									return done(false, 'Something went wrong!');
								} else {
									logger.log('info', 'Database: Removed room '+room+'. User '+user._id+' left as the last member.');
									return done(true, 'Successfully left the room!');
								}
							});
						} else {
							// Remove user from the people belonging to the room
							result.people.splice(index, 1);
							saveRoomObject(result, function (success) {
								if (!success) {
									return done(false, 'Something went wrong!', false);
								} else {
									return done(true, 'Successfully left the room!', result.name);
								}
							})
						}
					}
				});
			}
		});
	};

	// Save a new channel into a room
	function addChannelToRoom(room, channel, done) {
		if (channel.length < 3 || channel.length > 15) {
			return done(false, 'Channel name has to be 3 - 15 characters!');
		}
		findRoomObjectById(room, function (result) {
			if (!result) { 
				logger.log('info', 'Database: Trying to add channel: '+channel+'in room: '+room+'. But room not found!');
				return done(false, 'Room not found!'); 
			}
			channelBelongsToRoomObject(channel, result, function(belongs) {
				if (belongs) {
					logger.log('info', 'Database: Trying to create duplicate channel: '+channel+'in room: '+room);
					return done(false, 'Room already contains that channel!');
				} else {
					result.channels.push(channel);
					saveRoomObject(result, function (success) {
						if (success) {
							logger.log('info', 'Database: New channel '+channel+' created in room: '+room);
							return done(true, 'Channel successfully created!');
						} else {
							return done(false, 'Something went wrong!');
						}
					});
				}
			});
		});
	};

	// Query a range of messages
	function getChannelMessages (room, channel, range, done) {
		Message.find({
			room    : room,
			channel : channel
		}).sort({
			_id : -1 // Newest to oldest
		}).limit(range).exec(function (err, result) {
			if (err) {
				logger.log('error', 'Database: Couldn\'t fetch range: '+range+' messages on channel: '+channel+' in room: '+room);
				return done('{[]}');
			} else {
				logger.log('silly', 'Database: Fetched '+result.length+' messages, channel: '+channel+', room: '+room);
				return done(JSON.stringify(result));
			}
		});
	};

	// Query a range of messages between two people
	function getPrivateMessages (room, user, another, range, done) {
		Message.find({
			room : room,
			$or : [
				{ sender  : user, channel : '@'+another },
				{ sender  : another, channel : '@'+user }
			]
		}).sort({
			_id : -1 // Newest to oldest
		}).limit(range).exec(function (err, result) {
			if (err) {
				logger.log('error', 'Database: Couldn\'t fetch range: '+range+' messages of private chat between '+user+' and '+another+' in room: '+room);
				return done('{[]}');
			} else {
				logger.log('silly', 'Database: Fetched '+result.length+' messages, private chat between '+user+' and '+another+' in room: '+room);
				return done(JSON.stringify(result));
			}
		});
	}

	// Check if a Room exists
	function joinRoomAndChannel (room, channel, user, done) {
		findRoomObjectByName(room, function (roomObject) {
			// Room doesn't exist
			if (!roomObject) {
				logger.log('info', 'Database: Couldn\'t find room: '+room+' for user: '+user._id);
				return done(false, false);
			} else {
				// Found a room, check if user is a member of it
				userBelongsToRoomObject(user, roomObject, function (belongs) {
					// If user doesn't belong to the room, add user
					if (!belongs) {
						addUserToRoom(user, roomObject._id, function () {});
					} 
					// If a private chat
					if (channel.charAt(0) === '@') {
						usernameBelongsToRoomObject(channel.slice(1), roomObject, function (truth) {
							return done(true, truth, roomObject._id);
						});
					} else {
						// Not a private chat, but really a channel
						channelBelongsToRoomObject(channel, roomObject, function (truth) {
							return done(true, truth, roomObject._id);
						});
					}					
				});
			}
		});
	};

	// ROOM HELPER FUNCTIONS

	// Creates a new room from room json
	function createNewRoomObject (room, done) {
		return saveRoomObject(new Room(room), done);
	};

	// Save Room object
	function saveRoomObject (room, done) {
		room.save(function (err) {
			if (err) {
				logger.log('error', 'Database: Failed to save room: '+room);
				return done(false);
			}
			return done(true);
		});
	}

	// Delete room
	function deleteRoomObject (room, done) {
		room.remove(function (err) {
			if (err) {
				logger.log('error', 'Database: Failed removing room '+room);
				return done(false);
			}
			return done(true);
		});
	};

	// Find a Room and People in it by id
	function findRoomObjectById (room, done) {
		Room.findOne({_id: room}).populate('people').exec(function (err, result) {
			if (err) {
				logger.log('error', 'Database: Error loading room by id: '+room);
				return done(false);
			} else if (!result) {
				return done(false);
			} else {
				return done(result);
			}
		});
	};

	// Find a Room and people in it by name
	function findRoomObjectByName (name, done) {
		Room.findOne({name: name}).populate('people').exec(function (err, result) {
			if (err) {
				logger.log('error', 'Database: Error loading room by name: '+room);
				return done(false);
			} else if (!result) {
				return done(false);
			} else {
				return done(result);
			}
		});
	};

	// See if a person belongs to a room
	function userBelongsToRoomObject (user, roomObject, done) {
		var index = -1;
		for (var i=0; i<roomObject.people.length; i++) {
			if (roomObject.people[i]._id.toString() === user._id.toString()) {
				index = i;
				break;
			}
		}
		if (index !== -1) {
			return done(true, index);
		} else {
			return done(false, index);
		}
	};

	// Check if a username belongs to room's people
	function usernameBelongsToRoomObject (user, roomObject, done) {
		var index = -1;
		for (var i=0; i<roomObject.people.length; i++) {
			console.log('database:'+roomObject.people[i]);
			console.log('\nuser:'+user+'\n\n');
			if (roomObject.people[i].local.username === user) {
				index = i;
				break;
			}
		}
		if (index !== -1) {
			return done(true);
		} else {
			return done(false);
		}
	};

	// See if a channel belongs to a room
	function channelBelongsToRoomObject (channel, roomObject, done) {
		var index = -1;
		for (var i=0; i<roomObject.people.length; i++) {
			if (roomObject.channels[i] === channel) {
				index = i;
				break;
			}
		}
		if (index !== -1) {
			return done(true);
		} else {
			return done(false);
		}
	};

	// Query all the people belonging into a room
	function getPeopleByRoomId (room, done) {
		findRoomObjectById(room, function (result) {
			return done(JSON.stringify(result.people));
		});
	};

	// Query all channels belonging into a room
	function getChannelsByRoomId (room, done) {
		findRoomObjectById(room, function (result) {
			return done(JSON.stringify(result.channels));
		});
	};

	return {
		addUserToRoom      : addUserToRoom,
		addChannelToRoom   : addChannelToRoom,
		getChannelMessages : getChannelMessages,
		getPrivateMessages : getPrivateMessages,
		getPeopleByRoomId  : getPeopleByRoomId,
		getChannelsByRoomId: getChannelsByRoomId,
		getRooms           : getRooms,
		getRoomsByUser     : getRoomsByUser,
		joinRoomAndChannel : joinRoomAndChannel,
		removeUserFromRoom : removeUserFromRoom,
		saveMessage        : saveMessage,
		saveRoom           : saveRoom
	}
};
