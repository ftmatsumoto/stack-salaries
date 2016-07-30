'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRouter = require('react-router');

var _auth = require('./auth/auth');

var _mainLayout = require('./components/layout/main-layout');

var _mainLayout2 = _interopRequireDefault(_mainLayout);

var _stats = require('./components/results/stats');

var _stats2 = _interopRequireDefault(_stats);

var _logout = require('./components/authentication/logout');

var _logout2 = _interopRequireDefault(_logout);

var _app = require('./containers/app');

var _app2 = _interopRequireDefault(_app);

var _jobs = require('./containers/jobs');

var _jobs2 = _interopRequireDefault(_jobs);

var _dashboard = require('./containers/dashboard');

var _dashboard2 = _interopRequireDefault(_dashboard);

var _signupForm = require('./containers/signup-form');

var _signupForm2 = _interopRequireDefault(_signupForm);

var _loginForm = require('./containers/login-form');

var _loginForm2 = _interopRequireDefault(_loginForm);

var _search = require('./containers/search');

var _search2 = _interopRequireDefault(_search);

var _results = require('./containers/results');

var _results2 = _interopRequireDefault(_results);

var _advancedSearch = require('./containers/advanced-search');

var _advancedSearch2 = _interopRequireDefault(_advancedSearch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// The react router renders components based on
// desired path


// Import all containers


// Import all actions & helper methods
// Import all required modules
exports.default = _react2.default.createElement(
  _reactRouter.Route,
  { path: '/', component: _mainLayout2.default },
  _react2.default.createElement(_reactRouter.IndexRoute, { component: _app2.default }),
  _react2.default.createElement(
    _reactRouter.Route,
    { path: 'results' },
    _react2.default.createElement(_reactRouter.IndexRoute, { component: _stats2.default })
  ),
  _react2.default.createElement(
    _reactRouter.Route,
    { path: 'login' },
    _react2.default.createElement(_reactRouter.IndexRoute, { component: _loginForm2.default })
  ),
  _react2.default.createElement(
    _reactRouter.Route,
    { path: 'signup' },
    _react2.default.createElement(_reactRouter.IndexRoute, { component: _signupForm2.default })
  ),
  _react2.default.createElement(
    _reactRouter.Route,
    { path: 'dashboard' },
    _react2.default.createElement(_reactRouter.IndexRoute, { component: _dashboard2.default })
  ),
  _react2.default.createElement(
    _reactRouter.Route,
    { path: 'advancedsearch' },
    _react2.default.createElement(_reactRouter.IndexRoute, { component: _advancedSearch2.default })
  ),
  _react2.default.createElement(
    _reactRouter.Route,
    { path: 'jobs' },
    _react2.default.createElement(_reactRouter.IndexRoute, { component: _jobs2.default })
  ),
  _react2.default.createElement(
    _reactRouter.Route,
    { path: 'logout' },
    _react2.default.createElement(_reactRouter.IndexRoute, { component: _logout2.default })
  )
);

// Import all components

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQTs7OztBQUNBOztBQUdBOztBQUdBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUdBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBO0FBQ0E7OztBQVhBOzs7QUFSQTtBQUpBO2tCQXlCRTtBQUFBO0FBQUEsSUFBTyxNQUFLLEdBQVosRUFBZ0IsK0JBQWhCO0FBQ0UsMkRBQVksd0JBQVosR0FERjtBQUdFO0FBQUE7QUFBQSxNQUFPLE1BQUssU0FBWjtBQUNFLDZEQUFZLDBCQUFaO0FBREYsR0FIRjtBQU9FO0FBQUE7QUFBQSxNQUFPLE1BQUssT0FBWjtBQUNFLDZEQUFZLDhCQUFaO0FBREYsR0FQRjtBQVdFO0FBQUE7QUFBQSxNQUFPLE1BQUssUUFBWjtBQUNFLDZEQUFZLCtCQUFaO0FBREYsR0FYRjtBQWVFO0FBQUE7QUFBQSxNQUFPLE1BQUssV0FBWjtBQUNFLDZEQUFZLDhCQUFaO0FBREYsR0FmRjtBQW1CRztBQUFBO0FBQUEsTUFBTyxNQUFLLGdCQUFaO0FBQ0MsNkRBQVksbUNBQVo7QUFERCxHQW5CSDtBQXVCRTtBQUFBO0FBQUEsTUFBTyxNQUFLLE1BQVo7QUFDRSw2REFBWSx5QkFBWjtBQURGLEdBdkJGO0FBMkJFO0FBQUE7QUFBQSxNQUFPLE1BQUssUUFBWjtBQUNFLDZEQUFZLDJCQUFaO0FBREY7QUEzQkYsQzs7QUFsQkYiLCJmaWxlIjoicm91dGVyLWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBJbXBvcnQgYWxsIHJlcXVpcmVkIG1vZHVsZXNcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBSb3V0ZSwgYnJvd3Nlckhpc3RvcnksIEluZGV4Um91dGUgfSBmcm9tICdyZWFjdC1yb3V0ZXInO1xuXG4vLyBJbXBvcnQgYWxsIGFjdGlvbnMgJiBoZWxwZXIgbWV0aG9kc1xuaW1wb3J0IHsgbG9nZ2VkSW4sIGxvZ091dCB9IGZyb20gJy4vYXV0aC9hdXRoJztcblxuLy8gSW1wb3J0IGFsbCBjb21wb25lbnRzXG5pbXBvcnQgTWFpbkxheW91dCBmcm9tICcuL2NvbXBvbmVudHMvbGF5b3V0L21haW4tbGF5b3V0JztcbmltcG9ydCBTdGF0cyBmcm9tICcuL2NvbXBvbmVudHMvcmVzdWx0cy9zdGF0cyc7XG5pbXBvcnQgTG9nb3V0IGZyb20gJy4vY29tcG9uZW50cy9hdXRoZW50aWNhdGlvbi9sb2dvdXQnO1xuXG4vLyBJbXBvcnQgYWxsIGNvbnRhaW5lcnNcbmltcG9ydCBBcHAgZnJvbSAnLi9jb250YWluZXJzL2FwcCc7XG5pbXBvcnQgSm9icyBmcm9tICcuL2NvbnRhaW5lcnMvam9icyc7XG5pbXBvcnQgRGFzaGJvYXJkIGZyb20gJy4vY29udGFpbmVycy9kYXNoYm9hcmQnO1xuaW1wb3J0IFNpZ251cEZvcm0gZnJvbSAnLi9jb250YWluZXJzL3NpZ251cC1mb3JtJztcbmltcG9ydCBMb2dpbkZvcm0gZnJvbSAnLi9jb250YWluZXJzL2xvZ2luLWZvcm0nO1xuaW1wb3J0IFNlYXJjaCBmcm9tICcuL2NvbnRhaW5lcnMvc2VhcmNoJztcbmltcG9ydCBSZXN1bHRzIGZyb20gJy4vY29udGFpbmVycy9yZXN1bHRzJztcbmltcG9ydCBBZHZhbmNlZFNlYXJjaCBmcm9tICcuL2NvbnRhaW5lcnMvYWR2YW5jZWQtc2VhcmNoJztcblxuLy8gVGhlIHJlYWN0IHJvdXRlciByZW5kZXJzIGNvbXBvbmVudHMgYmFzZWQgb25cbi8vIGRlc2lyZWQgcGF0aFxuZXhwb3J0IGRlZmF1bHQgKFxuICA8Um91dGUgcGF0aD1cIi9cIiBjb21wb25lbnQ9e01haW5MYXlvdXR9PlxuICAgIDxJbmRleFJvdXRlIGNvbXBvbmVudD17QXBwfSAvPlxuXG4gICAgPFJvdXRlIHBhdGg9XCJyZXN1bHRzXCI+XG4gICAgICA8SW5kZXhSb3V0ZSBjb21wb25lbnQ9e1N0YXRzfSAvPlxuICAgIDwvUm91dGU+XG5cbiAgICA8Um91dGUgcGF0aD1cImxvZ2luXCI+XG4gICAgICA8SW5kZXhSb3V0ZSBjb21wb25lbnQ9e0xvZ2luRm9ybX0vPlxuICAgIDwvUm91dGU+XG5cbiAgICA8Um91dGUgcGF0aD1cInNpZ251cFwiPlxuICAgICAgPEluZGV4Um91dGUgY29tcG9uZW50PXtTaWdudXBGb3JtfSAvPlxuICAgIDwvUm91dGU+XG5cbiAgICA8Um91dGUgcGF0aD1cImRhc2hib2FyZFwiPlxuICAgICAgPEluZGV4Um91dGUgY29tcG9uZW50PXtEYXNoYm9hcmR9Lz5cbiAgICA8L1JvdXRlPlxuXG4gICAgIDxSb3V0ZSBwYXRoPVwiYWR2YW5jZWRzZWFyY2hcIj5cbiAgICAgIDxJbmRleFJvdXRlIGNvbXBvbmVudD17QWR2YW5jZWRTZWFyY2h9IC8+XG4gICAgPC9Sb3V0ZT5cblxuICAgIDxSb3V0ZSBwYXRoPVwiam9ic1wiPlxuICAgICAgPEluZGV4Um91dGUgY29tcG9uZW50PXtKb2JzfSAvPlxuICAgIDwvUm91dGU+XG5cbiAgICA8Um91dGUgcGF0aD1cImxvZ291dFwiPlxuICAgICAgPEluZGV4Um91dGUgY29tcG9uZW50PXtMb2dvdXR9IC8+XG4gICAgPC9Sb3V0ZT5cblxuICA8L1JvdXRlPlxuKTtcbiJdfQ==