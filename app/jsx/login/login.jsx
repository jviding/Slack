import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';

// Sign up and Login form
var UserForm = React.createClass({
	getInitialState: function () {
		return ({error: false, eMessage: '', login: true, request: 'login', sub: 'clickbox active', username: '', password: ''});
	},
	changeRequestPath: function () {
		// Switch the form between logging in or signing up
		var request = (this.state.login ? 'signup' : 'login');
		this.setState({login: !this.state.login, request: request});
	},
	mouseIn: function () {
		this.setState({sub: 'clickbox'});
	},
	mouseOut: function () {
		this.setState({sub: 'clickbox active'});
	},
	authRequest: function () {
		this.setState({error: false});
		// Validate username
		if (this.validateUsername()) {
			// Sign up or login
			$.ajax({
				method: 'POST',
				url: '/'+this.state.request,
				data: 'username='+encodeURIComponent(this.state.username)+'&password='+encodeURIComponent(this.state.password),
				success: function(data) {
					// On success forward to a new page
					location.href = data.redirect;
				}.bind(this),
				error: function(xhr, status, err) {
					// On error show the error message
					this.setState({error: true, eMessage: JSON.parse(xhr.responseText).error});
					console.error('/signup', status, err.toString());
				}.bind(this)
		    });
		}
	},
	pressEnter: function (event) {
		if (event.key == 'Enter') {
			event.preventDefault();
			// If enter is pressed try accepting the form
			this.authRequest();
		}
	},
	validateUsername: function () { 
		// Small letters a-z, capital letters A-Z and all numbers accepted
		if (!/^([a-zA-Z0-9]*)$/.test(this.state.username)) {
			this.setState({error: true, eMessage: 'Username contains illegal characters!'});
			return false;
		} else if (this.state.username.length < 4 || this.state.username.length > 15) {
			this.setState({error: true, eMessage: 'Username has to be 4 - 15 characters!'});
			return false;
		} else if (this.state.password.length < 6 || this.state.password.length > 20) {
			this.setState({error: true, eMessage: 'Password has to be 6 - 20 characters!'});
			return false;
		}
		return true;
	},
	render: function () {
		return (
			<form>
				{this.state.login && <div className="header">Login</div>}
				{!this.state.login && <div className="header">Sign up</div>}
				<div className="wrapper first">
					<span className="glyphicon glyphicon-user" />
					<input  type="text" onKeyDown={this.pressEnter} onChange={(e) => this.setState({username: e.target.value})} placeholder="Username" />
				</div>
				<div className="wrapper">
					<span className="glyphicon glyphicon-lock" />
					<input type="password" onKeyDown={this.pressEnter} onChange={(e) => this.setState({password: e.target.value})} placeholder="Password" />
				</div>
				{this.state.error && <div className="error">{this.state.eMessage}</div>}
				<div className="wrapper">
					{this.state.login && <div onMouseEnter={this.mouseIn} onMouseLeave={this.mouseOut} onClick={this.changeRequestPath} className="clickbox click">Sign up</div>}
					{!this.state.login && <div onMouseEnter={this.mouseIn} onMouseLeave={this.mouseOut} onClick={this.changeRequestPath} className="clickbox click">Login</div>}
					<div onClick={this.authRequest} className={this.state.sub}>Submit</div>
				</div>
			</form>
		);
	}
});

// Home page
var Page = React.createClass({
	render: function () {
		return (
			<div className="page">
				<div className="centerme">
					<div className="formcontainer">
						<UserForm />
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