import React from 'react';
import { Link } from 'react-router';


var Logo = (props) => {
  return(
    <div>
      <div className="row logo-headline">
        <div className="left">
          <Link to='/'><h3 className="text-left">STACK SALARIES</h3></Link>
        </div>

        <div className="right">
          {props.loggedIn ? (
              <div>
                <Link to='/dashboard'><button className="btn btn-primary login">Dashboard</button></Link>
                <Link to='/advancedsearch'><button className="btn btn-primary login">Advanced Search</button></Link>
                <Link to='/logout'><button className="btn btn-primary login">Log Out</button></Link>
              </div>
            ) : (
              <div>
                <Link to='/login'><button className="btn btn-primary login">Login</button></Link>
                <Link to='/signup'><button className="btn btn-primary login">Sign Up</button></Link>
              </div>
          )}
        </div>
      </div>
    </div>
    );
}

export default Logo;
