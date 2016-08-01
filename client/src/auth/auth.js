import $ from 'jquery';
// This file contains client side authentication helper methods
// The server sends back JWT tokens when a login/sign up is successful
// It also sends back the full user object that you can use in your reducers
// To check for authentication, we store the token in localStorage, which
// automatically expires when the browser is closed (not tabs)

// Return a true/false whether localStorage token exists
export function loggedIn(){
  return !!window.sessionStorage.token;
}

// Deletes the localStorage token
// New tokens are sent every time a user logs in
export function logOut(){
  $.ajax({
    url: "/logout",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({token: window.sessionStorage.token}),
    success: function(data) {
      if (!data.deleted) {
        console.error('Failure to find active user');
      }
    },
    error: function(err) {
      console.error(err);
    }
  })
  delete window.sessionStorage.token;
}

// Retrieves a given token from localStorage
export function retrieveToken(){
  return window.sessionStorage.token;
}
