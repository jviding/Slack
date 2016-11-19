import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';

// Socket.io
import io from 'socket.io-client';
var socket = io('http://'+require('./../../../config/io-config').ADDR+':3000');

// Navbar
var Navbar = React.createClass({
	myRooms: function () {
		// If not showing MY rooms
		if (!this.props.myRooms) {
			// Toggle MY rooms on
			this.props.toggleRooms(true);
		}
	},
	allRooms: function () {
		// If showing MY rooms
		if (this.props.myRooms) {
			// Toggle to show ALL rooms
			this.props.toggleRooms(false);
		}
	},
	logOut: function () {
		location.href = '/logout';
	},
	render: function () {
		return (
			<div className="headblock">
				<div className="navwrap">
					<div className="navblock">
						<div className="navheader">SLACK</div>
					</div>
					<div className="navblock">Chat rooms:</div>
					<div onClick={this.myRooms} className={(this.props.myRooms ? "navblock clickable active" : "navblock clickable")}>MY</div>
					<div onClick={this.allRooms} className={(this.props.myRooms ? "navblock clickable" : "navblock clickable active")}>ALL</div>
					<div className="navfiller"></div>
					<div onClick={this.logOut} className="navblock clickable">Logout</div>
				</div>
			</div>
		);
	}
});

// Room in a list
var RoomLine = React.createClass({
	getInitialState: function () {
		return ({show: false});
	},
	joinRoom: function (event) {
		// Prevent default and join if not a member yet
		if (!this.props.my) {
			event.preventDefault();
			$.ajax({
				method: 'POST',
				url: '/api/join/'+this.props.id,
				dataType: 'json',
				cache: false,
				success: function(data) {
					location.href = data.redirect;
				}.bind(this),
				error: function(xhr, status, err) {
					console.error('/api/join/'+this.props.id, status, err.toString());
				}.bind(this)
		    });
		}
	},
	leaveRoom: function (event) {
		event.preventDefault();
		$.ajax({
			method: 'POST',
			url: '/api/leave/'+this.props.id,
			dataType: 'json',
			cache: false,
			success: function(data) {
				this.props.reload(this.props.my);
			}.bind(this),
			error: function(xhr, status, err) {
				console.error('/api/leave/'+this.props.id, status, err.toString());
			}.bind(this)
	    });
	},
	render: function () {
		return (
			<div onMouseLeave={(e) => this.setState({show: false})} onMouseEnter={(e) => this.setState({show: true})} className="roomwrap">
				<div className="join">
					{!this.props.my && this.state.show && <a onClick={this.joinRoom} href={''}>Join</a>}
					{this.props.my && this.state.show && <a onClick={this.joinRoom} href={'/message/'+this.props.name+'/general'}>Open</a>}
				</div>
				<div onClick={(e) => this.setState({show: !this.state.show})} className="room"># {this.props.name}</div>
				<div className="remove">
					{this.props.my && this.state.show && <a onClick={this.leaveRoom} href="">Remove</a>}
				</div>
			</div>
		);
	}
});

// Body of our main element, contains a list of rooms
var PageBody = React.createClass({
	getInitialState: function () {
		return ({rooms: []});
	},
	componentDidMount: function () {
		this.loadRooms(this.props.myRooms);
		this.props.io.on('new room', function () {
			if (!this.props.myRooms) {
				this.loadRooms();
			}
		}.bind(this));
	},
	componentWillReceiveProps: function (nextProps) {
		if (nextProps.myRooms !== this.props.myRooms) {
			this.loadRooms(nextProps.myRooms);
		}
	},
	loadRooms: function (myRooms) {
		if (myRooms === true) {
			this.updateRooms('/api/myrooms/');
		} else {
			this.updateRooms('/api/rooms/');
		}
	},
	updateRooms: function (path) {
		$.ajax({
			url: path,
			dataType: 'json',
			cache: false,
			success: function(data) {
				this.setState({rooms: JSON.parse(data).rooms});
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(path, status, err.toString());
			}.bind(this)
	    });
	},
	render: function () {
		var rooms = this.state.rooms.map(function (room, index) {
			return (
				<RoomLine key={index} name={room.name} id={room._id} my={this.props.myRooms} reload={this.loadRooms} />
			);
		}.bind(this));
		return (
			<div className="appbody">
				<div className="appcontainer">
					{this.props.myRooms && <div className="roomhead">MY CHANNELS</div>}
					{!this.props.myRooms && <div className="roomhead">ALL CHANNELS</div>}
					<div className="rooms">
						{rooms}
					</div>
				</div>
			</div>
		);
	}
});

// Form for creating a new room
var RoomForm = React.createClass({
	getInitialState: function () {
		return ({room: '', error: false, eMessage: ''});
	},
	pressEnter: function (event) {
		if (event.key == 'Enter') {
			event.preventDefault();
			// If enter is pressed try accepting the form
			this.createRoom();
		}
	},
	createRoom: function () {
		// Validate the room name
		if (this.validateName()) {
			// Remove old error texts
			this.setState({error: false});
			// Try to create a new room
			$.ajax({
				method: 'POST',
				url: '/api/room/'+this.state.room,
				success: function(data) {
					// On success report new room
					this.props.io.emit('new room');
					// And go to the new room
					location.href = data.redirect;
				}.bind(this),
				error: function(xhr, status, err) {
					// On error show the error message
					this.setState({error: true, eMessage: JSON.parse(xhr.responseText).error});
					console.error('/api/room/'+this.state.room, status, err.toString());
				}.bind(this)
		    });
		}
	},
	validateName: function () {
		if (!/^([a-zA-Z0-9]*)$/.test(this.state.room)) {
			this.setState({error: true, eMessage: 'Room name contains illegal characters!'});
		} else if (this.state.room.length < 3 || this.state.room.length > 20) {
			this.setState({error: true, eMessage: 'Room name should contain 3 - 20 characters!'});
		} else {
			return true;
		}
		return false;
	},
	render: function () {
		return (
			<div className="botbar">
				<div className="wrapper">
					<input onKeyDown={this.pressEnter} onChange={(e) => this.setState({room: e.target.value})} placeholder="Create a new room..." />
					<div onClick={this.createRoom} className="submit">Create</div>
				</div>
				{this.state.error && <div className="error">{this.state.eMessage}</div>}
			</div>
		);
	}
});

// Home page
var Page = React.createClass({
	getInitialState: function () {
		return ({showMyRooms: true});
	},
	toggleRoomList: function (value) {
		// Toggle MY / ALL rooms in the list
		this.setState({showMyRooms: value});
	},
	render: function () {
		return (
			<div className="container-fluid">
				<div className="fullheight row">
					<div className="fullheight col-xs-10 col-sm-8 col-md-6 col-md-offset-3 col-sm-offset-2 col-xs-offset-1">
						<Navbar toggleRooms={this.toggleRoomList} myRooms={this.state.showMyRooms} />
						<PageBody io={socket} myRooms={this.state.showMyRooms} />
						<RoomForm io={socket} />
					</div>
				</div>
			</div>
		);
	}
});

// Render view
ReactDOM.render(
	<Page />,
	document.getElementById('page')
);