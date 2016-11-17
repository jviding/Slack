import React from 'react';
import $ from 'jquery';

// Messages divider when day changes
var NewDay = React.createClass({
	render: function () {
		var time = 'October 21st';
		return (
			<div className="newDay">
   				<div className="dayDivider"></div>
        		<div className="dayTime">{this.props.time}</div>
        	</div>
		);
	}
});

// The first message user sends into a chatbox
var NewMessage = React.createClass({
	render: function () {
		var img = 'img';
		return (
			<div className="newMsg">
        		<div className="usrImg">
        			<div className="img">{img}</div>
        		</div>
        		<div className="msgCont">
        			<div className="wrapper">
        				<div className="usrName">{this.props.sender}</div>
        				<div className="msgTime">{this.props.time}</div>
        			</div>
        			<div className="msgText">{this.props.message}</div>
        		</div>
        	</div>
		);
	}
});

// Messages user sends after the first message
var OldMessage = React.createClass({
	render: function () {
		return (
			<div className="oldMsg">
        		<div className="wrapper">
        			<div className="oldTime">{this.props.time}</div>
        			<div className="msgText">{this.props.message}</div>
        		</div>
			</div>
		);
	}
});

// Container for all the messages
var Messages = React.createClass({
	// Convert date object. Example: 'September 4th'
	getMonthDay: function (date) {
		var day = '';
		if (date.getDate() % 10 === 1 && date.getDate() !== 11) { day = date.getDate()+'st'; }
		else if (date.getDate() % 10 === 2 && date.getDate() !== 12) { day = date.getDate()+'nd'; }
		else if (date.getDate() % 10 === 3 && date.getDate() !== 13) { day = date.getDate()+'rd'; }
		else { day = date.getDate()+'th'; }
		var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		return months[date.getMonth()]+' '+day;
	},
	// Convert date object. Example: '5:23 PM'
	getHourMinute: function (date) {
		var minutes = (date.getMinutes() < 10 ? '0'+date.getMinutes() : ''+date.getMinutes());
		if (date.getHours() > 11) { return (date.getHours()-12) + ':' + minutes + ' PM'; } 
		else { return date.getHours() + ':' + minutes + ' AM'; }
	},
	// Information about the latest message received
	updatePrev: function (prev, msg) {
		prev.sender = msg.sender;
		prev.minutes = msg.time.getMinutes();
		prev.day = msg.time.getDate();
		return prev;
	},
	sortByTime: function (a, b) {
		return (new Date(a.time) <= new Date(b.time) ? -1 : 1)
	},
	render: function () {
		var prev = {sender: '', minutes: -6, day: -1};
		// If there are messages to show
		if (this.props.messages.length > 0) {
			// Traverse through the messages, note that they are sorted first
			var messages = this.props.messages.sort(this.sortByTime).map(function (msg, index) {
				msg.time = new Date(msg.time);
				// If the previous message is not from the same user or more than 5 minutes since it was sent
				if (msg.sender !== prev.sender || msg.time.getMinutes() - prev.minutes > 5 || msg.time.getDate() !== prev.day) {
					// If the day has changed since the previous message, add the date block
					if (msg.time.getDate() !== prev.day) {
						prev = this.updatePrev(prev, msg); // Update previous to be now this one
						return <div key={index}><NewDay time={this.getMonthDay(msg.time)} /><NewMessage sender={msg.sender} time={this.getHourMinute(msg.time)} message={msg.message} /></div>;
					} else {
						// Otherwise just the new message
						prev = this.updatePrev(prev, msg); // Update previous to be now this one
						return <NewMessage key={index} sender={msg.sender} time={this.getHourMinute(msg.time)} message={msg.message} />;
					}
				} else {
					// If the last message is from the same sender and less than 5 minutes have passed
					prev = this.updatePrev(prev, msg); // Update previous to be now this one
					return <OldMessage key={index} sender={msg.sender} time={this.getHourMinute(msg.time).slice(0,-3)} message={msg.message} />;
				}
			}.bind(this));
		} else {
			// If no messages - just show the current date
			var messages = <NewDay time={this.getMonthDay(new Date())} />
		}
		return (
			<div className="msgBox">{messages}</div>
		);
	}
});

// Form for sending new messages
var SendMessage = React.createClass({
	getInitialState: function () {
		return ({value: ''});
	},
	handleKey: function (event) {
		if (event.key == 'Enter') {
			event.preventDefault();
			this.sendMessage();
		}
	},
	handleChange: function (event) {
		this.setState({value: event.target.value});
	},
	sendMessage: function () {
		if (this.state.value !== '') {
			this.props.send(this.state.value);
			this.setState({value: ''});
		}
	},
	render: function () {
		return (
			<div className="sendCont">
        		<form>
        			<div className="wrapper">
        				<div className="sendMsg">
        					<input onKeyDown={this.handleKey} value={this.state.value} onChange={this.handleChange} type="text" placeholder="Send message..." autoFocus />
        				</div>
        				<div onClick={this.sendMessage} className="submitMsg">Submit</div>
	        		</div>
	        	</form>
        	</div>
		);	
	}
});

// CHATBOX

// Chatbox contains all messages and the form for sending new ones
export default React.createClass({
	getInitialState: function () {
		return ({messages: [], send: this.sendMessage});
	},
	componentDidMount: function () {
		// Start listening for incoming messages
		this.listenForMessages();
		// Request message history from server
		this.loadMessages(this.props.channel);
	},
	listenForMessages: function () {
		// Listen for messages sent by other users
		this.props.io.on('new message', function (msg) {
			if (this.props.channel === msg.channel) {
				this.appendMessages([msg]);
			}
		}. bind(this));
	},
	loadMessages: function (channel) {
		// Empty messages
		this.setState({messages: []});
		// Download the messages of the new channel
		$.ajax({
			url: '/api/'+this.props.room+'/'+channel+'/500', // get latest 500 messages
			dataType: 'json',
			cache: false,
			success: function(data) {
				this.appendMessages(JSON.parse(data).messages);
			}.bind(this),
			error: function(xhr, status, err) {
				console.error('/api/'+this.props.room+'/'+this.props.channel+'/500', status, err.toString());
			}.bind(this)
	    });
	},
	sendMessage: function (text) {
		var newMessage = {message: text, time: new Date(), sender: this.props.user, room: this.props.room, channel: this.props.channel};
		this.appendMessages([newMessage]);
		this.props.io.emit('new message', newMessage);
	},
	appendMessages: function (messages) {
		// Append messages in the chat
		this.setState({messages: this.state.messages.concat(messages)});
	},
	componentWillReceiveProps: function (nextProps) {
		// User switches to another channel
		if (this.props.channel !== nextProps.channel) {
			this.setState({messages: []});
			this.loadMessages(nextProps.channel);
		}
	},
	render: function () {
		return (
			<div className="chatbox">
	        	<div className="chatWrapper">
	        		<Messages messages={this.state.messages} />
	        		<SendMessage send={this.sendMessage} />
	        	</div>
	        </div>
		);
	}
});