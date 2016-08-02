// Import all required modules
import React from 'react';
import d3 from 'd3';
import { History, Router } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

// Import all actions & helper methods
import { setSearch } from '../actions/actionCreator';

// Import all containers
import search from '../containers/search';

class Results2 extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      width: 500,
      height: 500
    }
  }

  render() {


    return (
      <div>
        <div className="selection">
          <h3 className="text-center">Test</h3>
          {console.log(this.props.salary)}
        </div>
      </div>
    );
  }
};

function mapStateToProps(state) {
  return {
    salary: state.salary
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({setSearch: setSearch}, dispatch);
}


export default connect(mapStateToProps, mapDispatchToProps)(Results2);