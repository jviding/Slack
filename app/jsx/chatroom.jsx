class ShoppingList extends React.Component {
	render() {
	    return (
	      <div className="shopping-list">
	        <h1>Shopping List for {this.props.name}</h1>
	        <ul>
	          <li>Instagram</li>
	          <li>WhatsApp</li>
	          <li>Oculus</li>
	        </ul>
	      </div>
	    );
	  } 
} 

/*var About = React.createClass({
	render: function () {
		return <div>About</div>
	}
});

var Repos = React.createClass({
	render: function () {
		return <div>Repos</div>
	}
});

var Links = React.createClass({
	render: function () {
		return (
			<div>
				<h1>Hello, world!</h1>
				<ul role="nav">
					<li><window.Link to="/">About</window.Link></li>
					<li><window.Link to="/repos">Repos</window.Link></li>
				</ul>
				<h1>Hello, again!</h1>
			</div>
		)
	}
});*/

/*
				<window.Router history={window.hashHistory}>
					<window.Route path="/" component={About}/>
					<window.Route path="/repos" component={Repos}/>
				</window.Router>*/
/*
ReactDOM.render(
  <Links  />,
  document.getElementById('app')
);*/

