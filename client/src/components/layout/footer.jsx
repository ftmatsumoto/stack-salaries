import React from 'react';
import { Link } from 'react-router';

const Footer = React.createClass({
  render: function() {
    return(
      <div className="footer center-block text-center">
        <div className="row">
          <ul className="list-inline">
            <li><Link to='/'>About</Link> </li>
              <li><Link to='/'>Jobs</Link></li>
             <li><a href="https://github.com/HRR17-Jigglypuff">Team Jigglypuff</a></li>
             <li><Link to='/'>Contact</Link></li>
          </ul>
          <p className="lead">&copy; 2016 Stack Salaries</p>
        </div>
      </div>
    );
  }
});


export default Footer;
