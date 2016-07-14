import React from 'react';
import { Router, Route, browserHistory, IndexRoute } from 'react-router';

import MainLayout from './components/main-layout';

import App from './components/home';
import Stats from './components/stats';
import LoginPage from './components/loginpage';

export default (
  <Router history={browserHistory}>
    <Route component={MainLayout}>
      <Route path="/" component={App} />

      <Route path="results">
        <Route component={MainLayout}>
          <IndexRoute component={Stats} />
        </Route>
      </Route>

      <Route path="login">
        <Route component={MainLayout}>
          <IndexRoute component={LoginPage} />
        </Route>
      </Route>

    </Route>
  </Router>
);
