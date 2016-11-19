import React from 'react';
import $ from 'jquery';
import { browserHistory } from 'react-router';

// Option in People
var PeopleOption = React.createClass({
	getInitialState: function () {
		return ({prefixClass: 'prefix'});
	},
	componentDidMount: function () {
		this.props.io.on('new message', function (msg) {
			// If another than currently viewed channel receives a message notify user by changing the prefix red
			if (msg.channel.charAt(0) === '@' && msg.channel.slice(1) === this.props.myName && this.props.user.local.username === msg.sender) {
				this.setState({prefixClass: 'prefix active'});
			}
		}.bind(this));
	},
	onClick: function () {
		browserHistory.push('/message/'+this.props.roomName+'/@'+this.props.user.local.username);
		// Return prefix element color back to white when option is clicked
		this.setState({prefixClass: 'prefix'});
	},
	render: function () {
		if (this.props.active) {
			return (
				<div onClick={this.onClick} className="option active">
					<div className="wrapper">
						<div className="prefix">{this.props.prefix}</div>
						<div className="texthere">{this.props.user.local.username}{(this.props.user.local.username === this.props.myName ? ' (you)' : '')}</div>
					</div>
				</div>
			);
		} else {
			return (
				<div onClick={this.onClick} className="option">
					<div className="wrapper">
						<div className={this.state.prefixClass}>{this.props.prefix}</div>
						<div className="texthere">{this.props.user.local.username}{(this.props.user.local.username === this.props.myName ? ' (you)' : '')}</div>
					</div>
				</div>
			);
		}
	}
});

// List of people in a room
var PeoplesList = React.createClass({
	getInitialState: function () {
		return ({people: []});
	},
	componentDidMount: function () {
		this.loadPeople();
		this.receivePeople();
	},
	receivePeople: function () {
		// A new user joins the room
		this.props.io.on('new user', function (name) {
			for (var i=0; i<this.state.people.length; i++) {
				// If user already exists on the list don't reload it
				if (this.state.people[i].name === name) {
					return;
				}
			}
			this.loadPeople();
		}.bind(this));
	},
	loadPeople: function () {
		$.ajax({
			url: '/api/people/'+this.props.room,
			dataType: 'json',
			cache: false,
			success: function(data) {
				this.setState({people: JSON.parse(data).people});
			}.bind(this),
			error: function(xhr, status, err) {
				console.error('/api/people/'+this.props.room, status, err.toString());
			}.bind(this)
		});
	},
	sortByName: function (a, b) {
		return (a.local.username.toUpperCase() < b.local.username.toUpperCase() ? -1 : 1);
	},
	render: function () {
		var options = this.state.people.sort(this.sortByName).map(function (user, index) {
			var active = false;
			if (this.props.channel && this.props.channel.indexOf('@') === 0 && this.props.channel.slice(1) === user.local.username) {
				active = true;
			}
			return (
				<PeopleOption key={index} user={user} prefix={'@ '} myName={this.props.username} active={active} room={this.props.room} roomName={this.props.roomName} io={this.props.io} />
			);
		}.bind(this));
		return (
			<div className="box">
				{options}
			</div>
		);
	}
});

// Click a channel to chat on
var ChannelOption = React.createClass({
	getInitialState: function () {
		return ({prefixClass: 'prefix'});
	},
	componentDidMount: function () {
		// Color prefix red when another than the currently opened channel receives a message
		this.props.io.on('new message', function (msg) {
			if (this.props.name === msg.channel && this.props.channel !== msg.channel) {
				this.setState({prefixClass: 'prefix active'});
			}
		}.bind(this));
	},
	onClick: function () {
		browserHistory.push('/message/'+this.props.roomName+'/'+this.props.name);
		// Return the prefix back to white when option is clicked
		this.setState({prefixClass: 'prefix'});
	},
	render: function () {
		if (this.props.channel === this.props.name) {
			return (
				<div onClick={this.onClick} className="option active">
					<div className="wrapper">
						<div className="prefix">{this.props.prefix}</div>
						<div className="texthere">{this.props.name}</div>
					</div>
				</div>
			);
		} else {
			return (
				<div onClick={this.onClick} className="option">
					<div className="wrapper">
						<div className={this.state.prefixClass}>{this.props.prefix}</div>
						<div className="texthere">{this.props.name}</div>
					</div>
				</div>
			);
		}
	}
});

// List of different channels in a room
var ChannelsList = React.createClass({
	render: function () {
		var options = this.props.options.map(function (name, index) {
			return (
				<ChannelOption key={index} name={name} prefix={'# '} channel={this.props.channel} room={this.props.room} roomName={this.props.roomName} io={this.props.io} />
			);
		}.bind(this));
		return (
			<div className="box">{options}</div>
		);
	}
});

// Add new channel
var NewChannel = React.createClass({
	getInitialState: function () {
		return ({value: '', color: 'black'});
	},
	handleKey: function (event) {
		if (event.key == 'Enter') {
			event.preventDefault();
			this.addChannel();
		}
	},
	handleChange: function (event) {
		this.setState({value: event.target.value});
		if (!/^([a-zA-Z0-9]*)$/.test(event.target.value) || event.target.value > 15) {
			this.setState({color: 'red'});
		} else {
			this.setState({color: 'black'});
		}
	},
	addChannel: function () {
		if (/^([a-zA-Z0-9]*)$/.test(event.target.value) && this.state.value.length > 2 && this.state.value.length < 15) {
			this.props.add(this.state.value);
			this.setState({value: ''});
		}
	},
	render: function () {
		return (
			<div className="channelForm">
				<div className="wrapper">
					<input style={{color: this.state.color}} onKeyDown={this.handleKey} value={this.state.value} onChange={this.handleChange} type="text" placeholder="Channel name" autoFocus />
					<div onClick={this.addChannel} className="add">Add</div>
				</div>
			</div>
		);
	}
});

// SIDEBAR

// Sidebar on the left
export default React.createClass({
	getInitialState: function () {
		return {channels: [], show: false};
	},
	componentDidMount: function () {
		this.loadChannels();
		this.receiveChannels();
	},
	receiveChannels: function () {
		// A new channel was made, refresh the channels list
		this.props.io.on('new channel', function (data) {
			this.loadChannels();
		}.bind(this));
	},
	// Request all the channels of a room
	loadChannels: function () {
		$.ajax({
			url: '/api/channels/'+this.props.room,
			dataType: 'json',
			cache: false,
			success: function(data) {
				this.setState({channels: JSON.parse(data).channels});
			}.bind(this),
			error: function(xhr, status, err) {
				console.error('/api/channels/'+this.props.room, status, err.toString());
			}.bind(this)
		});
	},
	// Add a new channel to the room
	addChannel: function (channel) {
		$.ajax({
			method: 'POST',
			url: '/api/channels/'+this.props.room+'/'+channel,
			dataType: 'json',
			cache: false,
			success: function(data) {
				this.props.io.emit('new channel', this.props.room);
				this.loadChannels();
				this.setState({show: false});
			}.bind(this),
			error: function(xhr, status, err) {
				console.error('/api/channels/'+this.props.room+'/'+channel, status, err.toString());
			}.bind(this)
		});
	},
	// Form for adding a new channel
	showForm: function () {
		this.setState({show: !this.state.show});
	},
	render: function () {
		return (
			<div className="sidebar">
				<div className="header">{this.props.roomName.toUpperCase()}</div>
				<br /><br />
	          	<div onClick={this.showForm} className="miniheader hover">
	          		<div className="wrapper">
	          			<div className="head">CHANNELS</div>
	          			<div className="add">+</div>
	          		</div>
	          	</div>
	          	{this.state.show && <NewChannel add={this.addChannel} />}
	          	<ChannelsList options={this.state.channels} roomName={this.props.roomName} room={this.props.room} channel={this.props.channel} io={this.props.io} />
	          	<br />
	            <div className="miniheader">PEOPLE</div>
	            <PeoplesList username={this.props.user} options={this.props.people} roomName={this.props.roomName} room={this.props.room} channel={this.props.channel} io={this.props.io} />
	          	<div className="botbar">
	          		<div className="top">Joined as:</div>
	          		<div className="bot">{this.props.user}</div>
	          	</div>
          	</div>
		);
	}
});