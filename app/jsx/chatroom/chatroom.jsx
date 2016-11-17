import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, browserHistory } from 'react-router';
import ChatBox from './chatbox';
import Sidebar from './sidebar';

// Socket.io
import io from 'socket.io-client';
var socket = io('http://localhost:3000');

// var USER = '<username>' set on template

// Base view
var ChatPage = React.createClass({
	getInitialState: function () {
		// Join socket room
		socket.emit('join room', {user: USER, room: this.props.params.room});
		return {user: USER, room: this.props.params.room, channel: this.props.params.channel, unseen: ''};
	},
	componentDidMount: function () {
		// If path is only /:room or /:room/message set general as the default channel
		if (!this.props.params.channel) {
			browserHistory.push('/message/'+this.props.params.room+'/general');
		}
	},
	render: function () {
		return (
			<div className="chatpage">
				<Sidebar io={socket} user={this.state.user} room={this.state.room} channel={this.props.params.channel} />
				<ChatBox io={socket} user={this.state.user} room={this.state.room} channel={this.props.params.channel} newMessage={this.newMessage} />
			</div>
		);
	}
});

// Render view
ReactDOM.render(
	<Router history={browserHistory}>
		<Route path="/message/:room" component={ChatPage}>
			<Route path=":channel" />
		</Route>
	</Router>,
	document.getElementById('page')
);