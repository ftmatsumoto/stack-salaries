import React from 'react';
import { Link } from 'react-router';
import { logOut } from '../../auth/auth';

class Logout extends React.Component {
  constructor() {
    super();
  }

  componentWillMount(){
    logOut();
    this.context.router.push('/');
  }

  render() {
    return (
      <div></div>
    )
  }

}


Logout.contextTypes= {
  router: React.PropTypes.object.isRequired
};


export default Logout;
