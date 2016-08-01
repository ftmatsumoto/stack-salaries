// Import all required modules
import React from 'react';
import $ from 'jquery';
import { History, Router } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

// Import all actions & helper methods
import { setSearch, setCityState, setSearchValue } from '../actions/actionCreator';

// Import all needed components
import SearchInput from '../components/search/search-input';

class Search extends React.Component{

  constructor() {
    super();
    this.state = {
      stack: [],
      cityState: "",
      salary: {},
    };

    this.getDatafromServer = this.getDatafromServer.bind(this);
    this.findStack = this.findStack.bind(this);
    this.findCityState = this.findCityState.bind(this);
  }

  googleAPI() {
    var input = document.getElementById('searchTextField');
    var searchBox = new google.maps.places.SearchBox(input);
  }

  componentDidMount(){
    this.googleAPI();
  }

  findCityState(e) {
    this.setState({
      cityState: e.target.value
    });
  }

  findStack(e) {
    this.setState({
      stack: e.target.value.toLowerCase().split(', ')
    });
  }

  redirectToResults(){
    this.props.setSearch(this.state.salary);
    this.context.router.push('/results');
  }


  getDatafromServer(e) {
    e.preventDefault();

    var self = this;
    var cityState = document.getElementById("searchTextField").value.toLowerCase().split(", ");
    // Remember to lowercase -- its only not in lowercase now because you input the data in as MEAN
    // .toLowerCase()
    var data = {
      stack: this.state.stack,
      city: cityState[0],
      state:cityState[1]
    };

    $.ajax({
      url:"/search",
      type:"POST",
      contentType:"application/json",
      data: JSON.stringify(data),
      success: function(results) {
        console.log('here is the new results',results);
        self.setState({
          salary: results
        });
        self.props.setCityState({
          stack: self.state.stack,
          cityForJob: cityState[0],
          stateForJob: cityState[1]
        });
        self.redirectToResults();
      },
      error: function(err) {
        console.log(err);
      }
    });

  }

  render() {
    return (
      <div className="search-wrapper">
        <SearchInput
          getDatafromServer = {this.getDatafromServer}
          findStack = {this.findStack}
          findCityState= {this.findCityState}
          searchValue = {this.props.searchValue}
        />
      </div>
    );
  }
};

Search.contextTypes = {
  router: React.PropTypes.object.isRequired
};

  function mapStateToProps(state) {
    return {
      salary : state.salary
    }
  }


function mapDispatchToProps(dispatch) {
  return bindActionCreators({setSearch: setSearch, setCityState: setCityState }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Search);
