import React from 'react';
import { Link } from 'react-router';

var Login = (props) => {
  return(
    <div>
        {props.loggedIn ? (
              <div>
                <Link to='/dashboard'><button className="btn btn-primary login">Dashboard</button></Link>
                <Link to='/logout'><button className="btn btn-primary login">Log Out</button></Link>
              </div>
            ) : (
              <div>
                <Link to='/login'><button className="btn btn-primary login">Login</button></Link>
                <Link to='/signup'><button className="btn btn-primary login">Sign Up</button></Link>
              </div>
        )}

    </div>
  );

}

export default Login;
