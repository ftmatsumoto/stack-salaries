// Import all required modules
import React from 'react';
import $ from 'jquery';
import { Router, History } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

// Import all actions & helper methods
import { setUserInfo } from '../actions/actionCreator';

// Import all needed components
import SignupInput from '../components/authentication/signup-input';

class SignForm extends React.Component{
  constructor() {

    super();

    this.state = {
      name: "",
      password: "",
      email: "",
      gender: "",
      authToken: ""
    };
  }

  addUser(e) {
    this.setState({
      name: e.target.value
    });
  }

  addPassword(e) {
    this.setState({
      password: e.target.value
    });
  }

  addEmail(e) {
    this.setState({
      email: e.target.value
    });
  }

  addGender(e){
    this.setState({
      gender: e.target.value
    })
  }

 redirectToDashboard(user){
    if(user.id){
      var self = this;
      $.ajax({
        url: "/savetoken",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({email: user.email, token: window.sessionStorage.token}),
        success: function(data) {
          self.props.setUserInfo(data.user);
          self.context.router.push('/dashboard');
        },
        error: function(err) {
          console.error(err);
        }
      })
    } else {
       this.setState({
          hasError: true,
          errorType: "alert alert-danger",
          errorMessage: "Please check your email and password and try again!"
       });
    }
  }


  SignUpToServer(e) {
    e.preventDefault();
    var self = this;

    var data = {
      name: this.state.name,
      email: this.state.email,
      password: this.state.password,
      gender: this.state.gender
    };

    $.ajax({
      url:"/signup",
      type:"POST",
      contentType:"application/json",
      data: JSON.stringify(data),
      success: function(data) {
        window.sessionStorage.setItem('token', data.token),
        self.setState({
          authToken: data.token
        });
        self.redirectToDashboard(data.user);
      },
      error: function(err) {
        console.log(err);
      }
    });
  }

  render() {
    return (
      <div>
        <SignupInput SignUpToServer={this.SignUpToServer.bind(this)} addUser={this.addUser.bind(this)} addEmail={this.addEmail.bind(this)} addPassword={this.addPassword.bind(this)} addGender={this.addGender.bind(this)}/>
      </div>
    );
  }
}


SignForm.contextTypes= {
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

export default connect(mapStateToProps, mapDispatchToProps)(SignForm);
