// Import all required modules
import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

// Import all actions & helper methods
import { loggedIn } from '../auth/auth';
import { setUserInfo, setSearchValue } from '../actions/actionCreator';


// Import all needed components
import Login from '../components/authentication/login';
import Main from '../components/layout/main';
import Cloud from '../components/keywordCloud/cloud';

// Import all containers
import Search from '../containers/search';

class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      loggedIn: loggedIn()
    }

    // this.addStack.bind(this);

  }

  addStack(tag) {
    if (!this.props.searchValue) {
      this.props.setSearchValue(tag.value);
    } else {
      this.props.setSearchValue(this.props.searchValue + ', ' + tag.value);
    }
  }

  render() {
    return (
      <div>
      <div id="main" className="front">
        <div>
          <nav className="navbar navbar-default navbar-fixed-top">
            <Login loggedIn={this.state.loggedIn} userInfo={this.props.userInfo}/>
          </nav>
          <Main/>

          <Search history={this.props.history} searchValue={this.props.searchValue}/>
          <Cloud addStack={this.addStack.bind(this)}/>


        </div>
      </div>
      <div className="art">
      </div>
      </div>
    );
  }

}

App.contextTypes = {
  router: React.PropTypes.object.isRequired
}

function mapStateToProps(state) {
  return {
    userInfo: state.userInfo,
    searchValue: state.searchValue
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({setUserInfo, setSearchValue}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
