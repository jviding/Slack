import React from 'react';
import ReactDOM from 'react-dom';
import Recaptcha from 'react-recaptcha';
import $ from 'jquery';

// Sign up and Login form
var UserForm = React.createClass({
	getInitialState: function () {
		return ({error: false, eMessage: '', login: true, sub: 'clickbox active', username: '', password: ''});
	},
	componentDidMount: function () {
		if (this.props.wrong) {
			this.setState({error: true, eMessage: 'Something went wrong!'});
		}
	},
	authRequest: function () {
		this.setState({error: false});
		// Validate username
		if (this.validateUsername()) {
			if (this.state.login) {
				this.doLogin();
			} else {
				this.doSignup();
			}
		}
	},
	doLogin: function () {
		$.ajax({
			method: 'POST',
			url: '/login',
			data: 'username='+encodeURIComponent(this.state.username)+'&password='+encodeURIComponent(this.state.password),
			success: function(data) {
				// On success forward to a new page
				location.href = data.redirect;
			}.bind(this),
			error: function(xhr, status, err) {
				// On error show the error message
				this.setState({error: true, eMessage: JSON.parse(xhr.responseText).error});
				console.error('/login', status, err.toString());
			}.bind(this)
	    });
	},
	doSignup: function () {
		$.ajax({
			method: 'GET',
			url: '/api/username/'+this.state.username,
			success: function(data) {
				// On success ask captcha
				if (JSON.parse(data).success) {
					this.props.creds(this.state.username, this.state.password);
					this.props.doCaptcha();
				} else {
					this.setState({error: true, eMessage: JSON.parse(data).message});
				}
			}.bind(this),
			error: function(xhr, status, err) {
				console.error('/signup', status, err.toString());
			}.bind(this)
	    });
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
					{this.state.login && <div onMouseEnter={(e) => this.setState({sub: 'clickbox'})} onMouseLeave={(e) => this.setState({sub: 'clickbox active'})} onClick={(e) => this.setState({login: !this.state.login})} className="clickbox click">Sign up</div>}
					{!this.state.login && <div onMouseEnter={(e) => this.setState({sub: 'clickbox'})} onMouseLeave={(e) => this.setState({sub: 'clickbox active'})} onClick={(e) => this.setState({login: !this.state.login})} className="clickbox click">Login</div>}
					<div onClick={this.authRequest} className={this.state.sub}>Submit</div>
				</div>
			</form>
		);
	}
});

// Google captcha
var GoogleCaptcha = React.createClass({
	onloadCallback: function () {
		return;
	},
	verifyCallback: function (response) {
		$.ajax({
			method: 'POST',
			url: '/signup',
			data: 'username='+encodeURIComponent(this.props.usr)+'&password='+encodeURIComponent(this.props.psw)+'&captcha='+encodeURIComponent(response),
			success: function(data) {
				// On success forward to the home page
				location.href = data.redirect;
			}.bind(this),
			error: function(xhr, status, err) {
				// On error show the error message and go back to form
				console.error('/signup', status, err.toString());
				this.props.doCaptcha();
			}.bind(this)
	    });
	},
	render: function () {
		return (
			<div className="">
				<div className="header">Are you a robot?</div>
				<br /><br />
				<div className="captcha">
					<Recaptcha render="explicit" sitekey="6Ld-eQwUAAAAAECEtjYEX2syFlfpdDK00NiYWQru" onloadCallback={this.onloadCallback} verifyCallback={this.verifyCallback} />
				</div>
				<br />
			</div>
		);
	}
});

// Home page
var Page = React.createClass({
	getInitialState: function () {
		return ({captcha: false, username: '', password: '', wrong: false});
	},
	setCredentials: function (usr, psw) {
		this.setState({username: usr, password: psw});
	},
	render: function () {
		return (
			<div className="page">
				<div className="centerme">
					<div className="formcontainer">
						{!this.state.captcha && <UserForm wrong={this.state.wrong} creds={this.setCredentials} doCaptcha={() => this.setState({captcha: true})} />}
						{this.state.captcha && <GoogleCaptcha usr={this.state.username} psw={this.state.password} doCaptcha={() => this.setState({captcha: false, wrong: true})} />}
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