// Import all required modules
import React from 'react';
import $ from 'jquery';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { setSearch, setCityState } from '../actions/actionCreator';

// Import all actions & helper methods
import JobsList from '../components/jobs/jobs-list';

// Import all containers
import search from '../containers/search';

class Jobs extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      jobs: [],
      serialized: []
    };
  }

  componentWillMount(){
    this.getJobs();
  }
  componentWillReceiveProps(nextProps){
    if(this.props.cityState !== nextProps.cityState){
      var query = {
        publisher: "5453642953934453",
        format:"json",
        q: JSON.stringify(nextProps.cityState.stack),
        l: `${nextProps.cityState.cityForJob},
        ${nextProps.cityState.stateForJob}`,
        v: 2
      };
      this.getJobs(query);
    }
  }

  getJobs(query){

  var self = this;

  //Our query parameters
  if(!query){
    var query = {
      publisher: "5453642953934453",
      format:"json",
      q: JSON.stringify(this.props.cityState.stack),
      l: `${this.props.cityState.cityForJob},
      ${this.props.cityState.stateForJob}`,
      v: 2
    };
  }

    $.ajax({
      data: query,
      dataType: 'jsonp',
      type: 'GET',
      timeout: 5000,
      url: 'http://api.indeed.com/ads/apisearch',
      success: function(result){
        self.setState({
          jobs: result.results
        });
      },
      error: function(err){
        console.log(err);
      }
    });

  }



  render() {
    return (
      <div className="row">
          <div id="jobs">
            <JobsList jobs={this.state.jobs}/>
          </div>
      </div>
    );
  }

}


function mapStateToProps(state) {
  return {
    cityState: state.cityState
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({setSearch: setSearch, setCityState:setCityState}, dispatch);
}


export default connect(mapStateToProps, mapDispatchToProps)(Jobs);
