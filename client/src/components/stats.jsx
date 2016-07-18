import React from 'react';
import Login from './login';
import Logo from './logo';
import Results from './results';
import Search from './search';
import Footer from './footer';

const Stats = React.createClass({
  render: function() {
    return (
      <div>
        <Logo/>
        <nav className="navbar navbar-default navbar-fixed-top">
          <Login/>
        </nav>
        <div>
          <Results/>
          <Search/>
          <Footer/>
        </div>
      </div>
    );
  }
});

export default Stats;
