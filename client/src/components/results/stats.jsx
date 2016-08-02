// Import all required modules
import React from 'react';
import { History } from 'react-router';

// Import all actions & helper methods
import { loggedIn } from '../../auth/auth';

// Import all needed components
import Login from '../authentication/login';
import Logo from '../navigation/logo';
import Footer from '../layout/footer';

// Import all containers
import Jobs from '../../containers/jobs';
import Search from '../../containers/search';
import Results from '../../containers/results';
import Results2 from '../../containers/results2';
import AdvancedSearch from '../../containers/advanced-search';

class Stats extends React.Component {

  constructor() {
    super();

    this.state = {
      loggedIn: loggedIn(),
      graph: true,
      data: []
    }
  }

  changeGraph() {
    console.log(1111111111111)
    this.setState({
      graph: !this.state.graph
    });
  }

  componentWillMount() {

  }

  render() {
    if (this.state.graph) {
      return (
        <div className="container results">
            <nav id="resultNav" className="navbar navbar-default navbar-fixed-top">
              <Logo loggedIn={this.state.loggedIn} />
            </nav>
          <div>
            <div className="d3">
              <Results history={this.props.history}/>
            </div>
            <div className="inner-search">
              <button className="btn btn-primary" onClick={this.changeGraph.bind(this)}>Change</button>
              <p className="lead text-center">Another Search?</p>
              <Search/>
            </div>
            <div>
              <p className="lead text-center">Related Jobs in Your Area</p>
              <Jobs />
            </div>
            <Footer/>
          </div>
        </div>
      );
    } else {
      return (
        <div className="container results">
            <nav id="resultNav" className="navbar navbar-default navbar-fixed-top">
              <Logo loggedIn={this.state.loggedIn} />
            </nav>
          <div>
            <div className="d3">
              <Results2 history={this.props.history}/>
            </div>
            <div className="inner-search">
              <button className="btn btn-primary" onClick={this.changeGraph.bind(this)}>Change</button>
              <p className="lead text-center">Another Search?</p>
              <Search/>
            </div>
            <div>
              <p className="lead text-center">Related Jobs in Your Area</p>
              <Jobs />
            </div>
            <Footer/>
          </div>
        </div>
      );
    }

  }

}


export default Stats;
