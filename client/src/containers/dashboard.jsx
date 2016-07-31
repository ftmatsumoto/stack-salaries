// Import all required modules
import React from 'react';
import $ from 'jquery';
import { Router, Link } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

// Import all actions & helper methods
import { setUserInfo } from '../actions/actionCreator';
import { loggedIn } from '../auth/auth';
import Flash from '../utils/flash';

// Import all needed components
import DataInput from '../components/dashboard/dashboard-dataInput';
import Logo from '../components/navigation/logo';

class Dashboard extends React.Component {

  constructor (){
    super();
    this.state = {
      state:'',
      city: '',
      salary: null,
      education: '',
      gender: '',
      experience: '',
      stack: [],
      position:'',
      loggedIn: loggedIn(),
      userData: []
    };

    this.inputData = this.inputData.bind(this);
    this.addStack = this.addStack.bind(this);
    this.addCity = this.addCity.bind(this);
    this.addState = this.addState.bind(this);
    this.addEducation = this.addEducation.bind(this);
    this.addExperience = this.addExperience.bind(this);
    this.addPosition = this.addPosition.bind(this);
    this.addSalary = this.addSalary.bind(this);
  }

  addCity(e) {
    this.setState({
      city:e.target.value
    });
  }

  addState(e) {
    this.setState({
      state:e.target.value
    });
  }

  addEducation(e) {
    this.setState({
      education:e.target.value
    });
  }

  addExperience(e) {
    this.setState({
      experience:e.target.value
    });
  }

  addStack(e) {
    this.setState({
      stack: e.target.value
    });
  }

  addPosition(e) {
    this.setState({
      position:e.target.value
    });
  }

  addSalary(e) {
    this.setState({
      salary:e.target.value
    });
  }

  submitToStore() {
    var data = {
      stack: this.state.stack,
      city: this.state.city,
      state:this.state.state,
      education:this.state.education,
      experience:this.state.experience,
      position:this.state.position,
      salary:this.state.salary
    };

    this.props.setUserInfo(data);
  }

  inputData(e) {
    e.preventDefault();

    var self = this;

    var data = {
      stack: this.state.stack,
      city: this.state.city,
      state:this.state.state,
      education:this.state.education,
      experience:this.state.experience,
      position:this.state.position,
      salary: this.state.salary
    };

    $.ajax({
      url:"/stackentry",
      type:"POST",
      contentType:"application/json",
      data: JSON.stringify({salaryInfo: data, token: window.sessionStorage.token}),
      success: (data) => {
        this.setState({
          userData: data
        });
        self.submitToStore();
      },
      error: (err) => {
        console.log(err);
      }
    });

  }

  componentWillMount(){
    // query to grab userData array from user logged in
    // change after add token to the database
    $.ajax({
      url:"/user?name=aaaaa",
      type:"GET",
      contentType:"application/json",
      success: (data) => {
        console.log(data);
        this.setState({
          userData: data[0].userData
        });
      },
      error: (err) => {
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

      <div className="row under-nav">

        <div className= "gray-box panel panel-default">
            {this.props.userInfo ? (

        <div className="row dashboard-row center-block panel-body">
          <h1>Welcome <span className="color">{this.props.userInfo.name}</span> to the Dashboard</h1>

         <div>
              <p className="lead">Name: {this.props.userInfo.name}</p>
              <p className="lead">Email: {this.props.userInfo.email}</p>
              <p className="lead">Gender: {this.props.userInfo.gender}</p>
          </div>
        </div>
            ) : (
              <div></div>
        )}
        </div>
      </div>

      <div className="row dashboard-row center-block">
        { console.log(this.state.userData) }
        {this.state.userData.map((salaryEntry) => {
          return (
            <p>{salaryEntry.stack} - {salaryEntry.experience} - {salaryEntry.salary}</p>
          )
        })}
      </div>

      <div className="row dashboard-row center-block">
         <div className="loginMain">
          <DataInput
            inputData = {this.inputData}
            addStack = {this.addStack}
            addCity = {this.addCity}
            addState = {this.addState}
            addEducation = {this.addEducation}
            addExperience = {this.addExperience}
            addPosition = {this.addPosition}
            addSalary = {this.addSalary}
          />
        </div>
      </div>
    </div>
    );
  }
}

Dashboard.contextTypes = {
  router: React.PropTypes.object.isRequired
};

  function mapStateToProps(state) {
    return {
      userInfo: state.userInfo
    }
  }


function mapDispatchToProps(dispatch) {
  return bindActionCreators({setUserInfo: setUserInfo}, dispatch);
}


export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
