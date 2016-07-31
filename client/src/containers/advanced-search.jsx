// Import all required modules
import React from 'react';
import $ from 'jquery';
import { History, Router } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

// Import all actions & helper methods
import { setSearch, setCityState } from '../actions/actionCreator';
import { loggedIn } from '../auth/auth';

// Import all needed components
import AdvancedSearchInput from '../components/search/advance-searchInput';
import Logo from '../components/navigation/logo';

class AdvancedSearch extends React.Component{

  constructor() {
    super();
    this.state = {
      stack: [],
      city: "",
      state: "",
      education: "",
      gender: "",
      experience: "",
      salary: {},
      loggedIn: loggedIn()
    };

    // Assign bindings to avoid cluttering the render method
    this.GetAdvancedSearchData = this.GetAdvancedSearchData.bind(this);
    this.findStack             = this.findStack.bind(this);
    this.findCity              = this.findCity.bind(this);
    this.findState             = this.findState.bind(this);
    this.findEducation         = this.findEducation.bind(this);
    this.findGender            = this.findGender.bind(this);
    this.findExperience        = this.findExperience.bind(this);
  }

  findCity(e) {
    this.setState({
      city:e.target.value.toLowerCase()
    });
  }

  findState(e) {
    this.setState({
      state:e.target.value.toLowerCase()
    });
  }

  findEducation(e) {
    this.setState({
      education:e.target.value.toLowerCase()
    });
  }

  findGender(e) {
    this.setState({
      gender:e.target.value.toLowerCase()
    });
  }

  findExperience(e) {
    this.setState({
      experience:e.target.value.toLowerCase()
    });
  }

  findStack(e) {
    this.setState({
      stack: e.target.value.toLowerCase().split(', ')
    });
  }

  redirectToResults() {
    this.props.setSearch(this.state.salary);
    this.context.router.push('/results');
  }

  GetAdvancedSearchData(e) {
    e.preventDefault();

    var self = this;

    var data = {
      stack: this.state.stack,
      city: this.state.city,
      state:this.state.state,
      education: this.state.education,
      gender:this.state.gender,
      experience:this.state.experience
    };

    $.ajax({
      url:"/search",
      type:"POST",
      contentType:"application/json",
      data: JSON.stringify(data),
      success: function(results) {
        self.setState({
          salary: results
        });
        self.props.setCityState({
          stack: self.state.stack,
          cityForJob: self.state.city,
          stateForJob: self.state.state,
          education: self.state.education,
          gender: self.state.gender,
          experience:self.state.experience
        });
        self.redirectToResults(results);
      },
      error: function(err) {
        console.log(err);
      }
    });

  }


  render() {
    return (
    <div id="dashboard" className="container results">
      <nav id="resultNav" className="navbar navbar-default navbar-fixed-top">
        <Logo loggedIn={this.state.loggedIn} />
      </nav>

      <div className="row dashboard-row center-block">
        <div className="dashboard row">
          <h1>Advance Search</h1>
            <AdvancedSearchInput
              GetAdvancedSearchData={this.GetAdvancedSearchData}
              findStack={this.findStack}
              findCity={this.findCity}
              findState={this.findState}
              findEducation={this.findEducation}
              findGender={this.findGender}
              findExperience={this.findExperience}
            />
        </div>
      </div>
    </div>
    );
  }
};

AdvancedSearch.contextTypes= {
  router: React.PropTypes.object.isRequired
};


  function mapStateToProps(state) {
    return {
      salary : state.salary
    }
  }

  function mapDispatchToProps(dispatch) {
    return bindActionCreators({setSearch: setSearch, setCityState: setCityState}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(AdvancedSearch);