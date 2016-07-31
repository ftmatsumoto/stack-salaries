'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _user = require('./models/user');

var _user2 = _interopRequireDefault(_user);

var _stackdata = require('./models/stackdata');

var _stackdata2 = _interopRequireDefault(_stackdata);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _bcryptNodejs = require('bcrypt-nodejs');

var _bcryptNodejs2 = _interopRequireDefault(_bcryptNodejs);

var _jwtSimple = require('jwt-simple');

var _jwtSimple2 = _interopRequireDefault(_jwtSimple);

var _secret = require('./secret');

var _secret2 = _interopRequireDefault(_secret);

var _passport = require('./passport/passport');

var _passport2 = _interopRequireDefault(_passport);

var _local = require('./passport/local');

var _local2 = _interopRequireDefault(_local);

var _github = require('./passport/github');

var _github2 = _interopRequireDefault(_github);

var _passport3 = require('passport');

var _passport4 = _interopRequireDefault(_passport3);

var _expressPassportLogout = require('express-passport-logout');

var _expressPassportLogout2 = _interopRequireDefault(_expressPassportLogout);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _server = require('react-dom/server');

var _reactRouter = require('react-router');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var routes = require('./compiled/src/bundle').default;
var SD = require('./controllers/stackdataController');

var app = (0, _express2.default)();

app.use((0, _morgan2.default)('dev'));
app.use(_bodyParser2.default.urlencoded({ extended: true }));
app.use(_bodyParser2.default.json());
app.use(_express2.default.static(_path2.default.join(__dirname, '../client/compiled')));

// Mongoose Connection (Refactor into Separate File)
var databaseURL = process.env.MONGODB_URI || 'mongodb://localhost:27017/stack-salaries';

_mongoose2.default.connect(databaseURL);

// Helper Methods (Refactor into Separate File)
function generateToken(user) {
  // Add issued at timestamp and subject
  // Based on the JWT convention
  var timestamp = new Date().getTime();
  return _jwtSimple2.default.encode({ sub: user.id, iat: timestamp }, _secret2.default.secret);
}

// Set to false since tokens are being used
// This is Passport Authentication setup
// Github auth will be added here as well
var requireAuth = _passport4.default.authenticate('jwt', { session: false });
var requireSignIn = _passport4.default.authenticate('local', { session: false });
var githubAuth = _passport4.default.authenticate('github', { session: false, successRedirect: '/', failureRedirect: '/login' });

// Allow all headers
app.all('*', function (req, res, next) {

  res.header('Access-Control-Allow-Origin', '*');

  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE');

  res.header('Access-Control-Allow-Headers', 'Content-Type');

  next();
});

//Search for any field
app.post('/search', function (req, res, next) {
  SD.querySalary(req.body, function (results) {
    res.json(results);
  });
});

// Add a Stack Entry
app.post('/stackentry', function (req, res, next) {
  SD.createSalary(req.body, function (result) {
    res.status(201);
    res.json(result);
  });
});

// GET all users
app.get('/users', requireAuth, function (req, res, next) {
  _user2.default.find({}, function (err, users) {
    if (!err) {
      res.send(200, users);
    } else {
      throw err;
    }
  });
});

app.get('/users/:id', function (req, res, next) {
  var id = req.params.id;

  // A friendly error to display if no user matches the id
  var err = "No such user with the given id";

  _user2.default.findOne({ id: id }, function (err, existingUser) {
    if (err) {
      res.send(err);
    } else {
      res.json(existingUser);
    }
  });
});

// The middleware will verify credentials
// If successful, hand a token
app.post('/signin', requireSignIn, function (req, res, next) {

  // Generate a token
  var token = generateToken(req.user);

  // Send user back a JWT upon successful account creation
  res.json({ user: req.user, token: token });
});

app.post('/signup', function (req, res, next) {
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var gender = req.body.gender;

  // Validation to check if all the fields were being passed
  if (!email || !password || !name) {
    return res.send(422, { error: "Please fill out all the fields" });
  }

  // Check email already exists
  _user2.default.findOne({ email: email }, function (err, existingUser) {

    if (err) {
      return next(err);
    }

    // If it does, return "existing account" message
    if (existingUser) {
      // Return unprocessable entity
      return res.send(422, { error: 'Email is in use' });
    }

    // If not, create and save user
    var user = new _user2.default({
      name: name,
      email: email,
      password: password,
      gender: gender
    });

    user.save(function (err) {
      if (err) {
        return next(err);
      }

      // Generate a token
      var token = generateToken(user);

      // Send user back a JWT upon successful account creation
      res.json({ user: user, token: token });
    });
  });
});

// Log out a user
// Note, React Router is currently handling this
app.get('/logout', (0, _expressPassportLogout2.default)(), function (req, res, next) {
  res.redirect('/login');
});

// Root Path
app.get('*', function (req, res, next) {
  (0, _reactRouter.match)({ routes: routes, location: req.url }, function (error, redirectLocation, renderProps) {
    if (error) {
      res.status(500).send(error.message);
    } else if (redirectLocation) {
      res.redirect(302, redirectLocation.pathname + redirectLocation.search);
    } else if (renderProps) {
      // You can also check renderProps.components or renderProps.routes for
      // your "not found" component or route respectively, and send a 404 as
      // below, if you're using a catch-all route.
      res.status(200).send((0, _server.renderToString)(_react2.default.createElement(_reactRouter.RouterContext, renderProps)));
    } else {
      res.status(404).send('Not found');
    }
  });
});

var port = process.env.PORT || 3000;

app.listen(port);
console.log('Server now listening on port ' + port);

module.exports = app;

//# sourceMappingURL=data:application/json;base64,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M0I7QUFDRCxLQUZELE1BRU8sSUFBSSxnQkFBSixFQUFzQjtBQUMzQixVQUFJLFFBQUosQ0FBYSxHQUFiLEVBQWtCLGlCQUFpQixRQUFqQixHQUE0QixpQkFBaUIsTUFBL0Q7QUFDRCxLQUZNLE1BRUEsSUFBSSxXQUFKLEVBQWlCOzs7O0FBSXRCLFVBQUksTUFBSixDQUFXLEdBQVgsRUFBZ0IsSUFBaEIsQ0FBcUIsNEJBQWUsMERBQW1CLFdBQW5CLENBQWYsQ0FBckI7QUFDRCxLQUxNLE1BS0E7QUFDTCxVQUFJLE1BQUosQ0FBVyxHQUFYLEVBQWdCLElBQWhCLENBQXFCLFdBQXJCO0FBQ0Q7QUFDRixHQWJEO0FBY0QsQ0FmRDs7QUFpQkEsSUFBSSxPQUFPLFFBQVEsR0FBUixDQUFZLElBQVosSUFBb0IsSUFBL0I7O0FBRUEsSUFBSSxNQUFKLENBQVcsSUFBWDtBQUNBLFFBQVEsR0FBUixDQUFZLGtDQUFrQyxJQUE5Qzs7QUFFQSxPQUFPLE9BQVAsR0FBaUIsR0FBakIiLCJmaWxlIjoic2VydmVyLWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZXhwcmVzcyBmcm9tICdleHByZXNzJztcbmltcG9ydCBib2R5UGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcbmltcG9ydCBtb3JnYW4gZnJvbSAnbW9yZ2FuJztcbmltcG9ydCBtb25nb29zZSBmcm9tICdtb25nb29zZSc7XG5pbXBvcnQgVXNlciBmcm9tICcuL21vZGVscy91c2VyJztcbmltcG9ydCBTdGFja0RhdGEgZnJvbSAnLi9tb2RlbHMvc3RhY2tkYXRhJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGNvcnMgZnJvbSAnY29ycyc7XG5pbXBvcnQgYmNyeXB0IGZyb20gJ2JjcnlwdC1ub2RlanMnO1xuaW1wb3J0IGp3dCBmcm9tICdqd3Qtc2ltcGxlJztcbmltcG9ydCBzZWNyZXQgZnJvbSAnLi9zZWNyZXQnO1xuaW1wb3J0IHBhc3Nwb3J0QXV0aCBmcm9tICcuL3Bhc3Nwb3J0L3Bhc3Nwb3J0JztcbmltcG9ydCBsb2NhbEF1dGggZnJvbSAnLi9wYXNzcG9ydC9sb2NhbCc7XG5pbXBvcnQgZ2l0aHViIGZyb20gJy4vcGFzc3BvcnQvZ2l0aHViJztcbmltcG9ydCBwYXNzcG9ydCBmcm9tICdwYXNzcG9ydCc7XG5pbXBvcnQgbG9nb3V0IGZyb20gJ2V4cHJlc3MtcGFzc3BvcnQtbG9nb3V0JztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyByZW5kZXJUb1N0cmluZyB9IGZyb20gJ3JlYWN0LWRvbS9zZXJ2ZXInXG5pbXBvcnQgeyBtYXRjaCwgUm91dGVyQ29udGV4dCB9IGZyb20gJ3JlYWN0LXJvdXRlcidcbnZhciByb3V0ZXMgPSByZXF1aXJlKCcuL2NvbXBpbGVkL3NyYy9idW5kbGUnKS5kZWZhdWx0O1xudmFyIFNEID0gcmVxdWlyZSgnLi9jb250cm9sbGVycy9zdGFja2RhdGFDb250cm9sbGVyJyk7XG5cbnZhciBhcHAgPSBleHByZXNzKCk7XG5cbmFwcC51c2UobW9yZ2FuKCdkZXYnKSk7XG5hcHAudXNlKGJvZHlQYXJzZXIudXJsZW5jb2RlZCh7IGV4dGVuZGVkOiB0cnVlIH0pKTtcbmFwcC51c2UoYm9keVBhcnNlci5qc29uKCkpO1xuYXBwLnVzZShleHByZXNzLnN0YXRpYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vY2xpZW50L2NvbXBpbGVkJykpKTtcblxuXG4vLyBNb25nb29zZSBDb25uZWN0aW9uIChSZWZhY3RvciBpbnRvIFNlcGFyYXRlIEZpbGUpXG52YXIgZGF0YWJhc2VVUkwgPSBwcm9jZXNzLmVudi5NT05HT0RCX1VSSSB8fCdtb25nb2RiOi8vbG9jYWxob3N0OjI3MDE3L3N0YWNrLXNhbGFyaWVzJ1xuXG5tb25nb29zZS5jb25uZWN0KGRhdGFiYXNlVVJMKTtcblxuLy8gSGVscGVyIE1ldGhvZHMgKFJlZmFjdG9yIGludG8gU2VwYXJhdGUgRmlsZSlcbmZ1bmN0aW9uIGdlbmVyYXRlVG9rZW4odXNlcil7XG4gIC8vIEFkZCBpc3N1ZWQgYXQgdGltZXN0YW1wIGFuZCBzdWJqZWN0XG4gIC8vIEJhc2VkIG9uIHRoZSBKV1QgY29udmVudGlvblxuICB2YXIgdGltZXN0YW1wID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHJldHVybiBqd3QuZW5jb2RlKHsgc3ViOiB1c2VyLmlkLCBpYXQ6IHRpbWVzdGFtcCB9LCBzZWNyZXQuc2VjcmV0KTtcbn1cblxuLy8gU2V0IHRvIGZhbHNlIHNpbmNlIHRva2VucyBhcmUgYmVpbmcgdXNlZFxuLy8gVGhpcyBpcyBQYXNzcG9ydCBBdXRoZW50aWNhdGlvbiBzZXR1cFxuLy8gR2l0aHViIGF1dGggd2lsbCBiZSBhZGRlZCBoZXJlIGFzIHdlbGxcbnZhciByZXF1aXJlQXV0aCA9IHBhc3Nwb3J0LmF1dGhlbnRpY2F0ZSgnand0JywgeyBzZXNzaW9uOiBmYWxzZSB9ICk7XG52YXIgcmVxdWlyZVNpZ25JbiA9IHBhc3Nwb3J0LmF1dGhlbnRpY2F0ZSgnbG9jYWwnLCB7IHNlc3Npb246IGZhbHNlIH0pO1xudmFyIGdpdGh1YkF1dGggPSBwYXNzcG9ydC5hdXRoZW50aWNhdGUoJ2dpdGh1YicsIHsgc2Vzc2lvbjogZmFsc2UsIHN1Y2Nlc3NSZWRpcmVjdDogJy8nLCBmYWlsdXJlUmVkaXJlY3Q6ICcvbG9naW4nfSk7XG5cbi8vIEFsbG93IGFsbCBoZWFkZXJzXG5hcHAuYWxsKCcqJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHvigKhcbiAgcmVzLmhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJywgJyonKTvigKhcbiAgcmVzLmhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcycsICdQVVQsIEdFVCwgUE9TVCwgREVMRVRFJyk74oCoXG4gIHJlcy5oZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnLCAnQ29udGVudC1UeXBlJyk74oCoXG4gIG5leHQoKTvigKhcbn0pO1xuXG4vL1NlYXJjaCBmb3IgYW55IGZpZWxkXG5hcHAucG9zdCgnL3NlYXJjaCcsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIFNELnF1ZXJ5U2FsYXJ5KHJlcS5ib2R5LCBmdW5jdGlvbihyZXN1bHRzKSB7XG4gICAgcmVzLmpzb24ocmVzdWx0cyk7XG4gIH0pO1xufSk7XG5cbi8vIEFkZCBhIFN0YWNrIEVudHJ5XG5hcHAucG9zdCgnL3N0YWNrZW50cnknLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICBTRC5jcmVhdGVTYWxhcnkocmVxLmJvZHksIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgIHJlcy5zdGF0dXMoMjAxKTtcbiAgICByZXMuanNvbihyZXN1bHQpO1xuICB9KTtcbn0pO1xuXG4vLyBHRVQgYWxsIHVzZXJzXG5hcHAuZ2V0KCcvdXNlcnMnLCByZXF1aXJlQXV0aCwgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgVXNlci5maW5kKHt9LCBmdW5jdGlvbihlcnIsIHVzZXJzKSB7XG4gICAgaWYoIWVycikge1xuICAgICAgcmVzLnNlbmQoMjAwLCB1c2Vycyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH0pO1xufSk7XG5cbmFwcC5nZXQoJy91c2Vycy86aWQnLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICB2YXIgaWQgPSByZXEucGFyYW1zLmlkO1xuXG4gIC8vIEEgZnJpZW5kbHkgZXJyb3IgdG8gZGlzcGxheSBpZiBubyB1c2VyIG1hdGNoZXMgdGhlIGlkXG4gIHZhciBlcnIgPSBcIk5vIHN1Y2ggdXNlciB3aXRoIHRoZSBnaXZlbiBpZFwiO1xuXG4gICBVc2VyLmZpbmRPbmUoeyBpZDogaWR9LCBmdW5jdGlvbihlcnIsIGV4aXN0aW5nVXNlcikge1xuICAgIGlmKGVycikge1xuICAgICAgcmVzLnNlbmQoZXJyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzLmpzb24oZXhpc3RpbmdVc2VyKTtcbiAgICB9XG4gICB9KTtcbn0pO1xuXG4vLyBUaGUgbWlkZGxld2FyZSB3aWxsIHZlcmlmeSBjcmVkZW50aWFsc1xuLy8gSWYgc3VjY2Vzc2Z1bCwgaGFuZCBhIHRva2VuXG5hcHAucG9zdCgnL3NpZ25pbicsIHJlcXVpcmVTaWduSW4sIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG5cbiAgLy8gR2VuZXJhdGUgYSB0b2tlblxuICB2YXIgdG9rZW4gPSBnZW5lcmF0ZVRva2VuKHJlcS51c2VyKTtcblxuICAvLyBTZW5kIHVzZXIgYmFjayBhIEpXVCB1cG9uIHN1Y2Nlc3NmdWwgYWNjb3VudCBjcmVhdGlvblxuICByZXMuanNvbih7dXNlcjogcmVxLnVzZXIsIHRva2VuOiB0b2tlbn0pO1xufSk7XG5cbmFwcC5wb3N0KCcvc2lnbnVwJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgdmFyIG5hbWUgPSByZXEuYm9keS5uYW1lO1xuICB2YXIgZW1haWwgPSByZXEuYm9keS5lbWFpbDtcbiAgdmFyIHBhc3N3b3JkID0gcmVxLmJvZHkucGFzc3dvcmQ7XG4gIHZhciBnZW5kZXIgPSByZXEuYm9keS5nZW5kZXI7XG5cbiAgLy8gVmFsaWRhdGlvbiB0byBjaGVjayBpZiBhbGwgdGhlIGZpZWxkcyB3ZXJlIGJlaW5nIHBhc3NlZFxuICBpZighZW1haWwgfHwgIXBhc3N3b3JkIHx8ICFuYW1lKXtcbiAgICByZXR1cm4gcmVzLnNlbmQoNDIyLCB7ZXJyb3I6IFwiUGxlYXNlIGZpbGwgb3V0IGFsbCB0aGUgZmllbGRzXCJ9KTtcbiAgfVxuXG4gIC8vIENoZWNrIGVtYWlsIGFscmVhZHkgZXhpc3RzXG4gIFVzZXIuZmluZE9uZSh7IGVtYWlsOiBlbWFpbH0sIGZ1bmN0aW9uKGVyciwgZXhpc3RpbmdVc2VyKSB7XG5cbiAgICBpZihlcnIpIHsgcmV0dXJuIG5leHQoZXJyKTsgfVxuXG4gICAgLy8gSWYgaXQgZG9lcywgcmV0dXJuIFwiZXhpc3RpbmcgYWNjb3VudFwiIG1lc3NhZ2VcbiAgICBpZihleGlzdGluZ1VzZXIpe1xuICAgICAgLy8gUmV0dXJuIHVucHJvY2Vzc2FibGUgZW50aXR5XG4gICAgICByZXR1cm4gcmVzLnNlbmQoNDIyLCB7IGVycm9yOiAnRW1haWwgaXMgaW4gdXNlJyB9KTtcbiAgICB9XG5cbiAgICAvLyBJZiBub3QsIGNyZWF0ZSBhbmQgc2F2ZSB1c2VyXG4gICAgdmFyIHVzZXIgPSBuZXcgVXNlcih7XG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgZW1haWw6IGVtYWlsLFxuICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxuICAgICAgZ2VuZGVyOiBnZW5kZXJcbiAgICB9KTtcblxuICAgIHVzZXIuc2F2ZShmdW5jdGlvbihlcnIpe1xuICAgICAgaWYgKGVycikgeyByZXR1cm4gbmV4dChlcnIpOyB9XG5cbiAgICAgIC8vIEdlbmVyYXRlIGEgdG9rZW5cbiAgICAgIHZhciB0b2tlbiA9IGdlbmVyYXRlVG9rZW4odXNlcik7XG5cbiAgICAgIC8vIFNlbmQgdXNlciBiYWNrIGEgSldUIHVwb24gc3VjY2Vzc2Z1bCBhY2NvdW50IGNyZWF0aW9uXG4gICAgICByZXMuanNvbih7dXNlcjogdXNlciwgdG9rZW46IHRva2VufSk7XG4gICAgfSk7XG5cbiAgfSk7XG5cbn0pO1xuXG4vLyBMb2cgb3V0IGEgdXNlclxuLy8gTm90ZSwgUmVhY3QgUm91dGVyIGlzIGN1cnJlbnRseSBoYW5kbGluZyB0aGlzXG5hcHAuZ2V0KCcvbG9nb3V0JywgbG9nb3V0KCksIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KXtcbiAgcmVzLnJlZGlyZWN0KCcvbG9naW4nKTtcbn0pO1xuXG4vLyBSb290IFBhdGhcbmFwcC5nZXQoJyonLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICBtYXRjaCh7IHJvdXRlcywgbG9jYXRpb246IHJlcS51cmwgfSwgKGVycm9yLCByZWRpcmVjdExvY2F0aW9uLCByZW5kZXJQcm9wcykgPT4ge1xuICAgIGlmIChlcnJvcikge1xuICAgICAgcmVzLnN0YXR1cyg1MDApLnNlbmQoZXJyb3IubWVzc2FnZSlcbiAgICB9IGVsc2UgaWYgKHJlZGlyZWN0TG9jYXRpb24pIHtcbiAgICAgIHJlcy5yZWRpcmVjdCgzMDIsIHJlZGlyZWN0TG9jYXRpb24ucGF0aG5hbWUgKyByZWRpcmVjdExvY2F0aW9uLnNlYXJjaClcbiAgICB9IGVsc2UgaWYgKHJlbmRlclByb3BzKSB7XG4gICAgICAvLyBZb3UgY2FuIGFsc28gY2hlY2sgcmVuZGVyUHJvcHMuY29tcG9uZW50cyBvciByZW5kZXJQcm9wcy5yb3V0ZXMgZm9yXG4gICAgICAvLyB5b3VyIFwibm90IGZvdW5kXCIgY29tcG9uZW50IG9yIHJvdXRlIHJlc3BlY3RpdmVseSwgYW5kIHNlbmQgYSA0MDQgYXNcbiAgICAgIC8vIGJlbG93LCBpZiB5b3UncmUgdXNpbmcgYSBjYXRjaC1hbGwgcm91dGUuXG4gICAgICByZXMuc3RhdHVzKDIwMCkuc2VuZChyZW5kZXJUb1N0cmluZyg8Um91dGVyQ29udGV4dCB7Li4ucmVuZGVyUHJvcHN9IC8+KSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzLnN0YXR1cyg0MDQpLnNlbmQoJ05vdCBmb3VuZCcpXG4gICAgfVxuICB9KVxufSk7XG5cbnZhciBwb3J0ID0gcHJvY2Vzcy5lbnYuUE9SVCB8fCAzMDAwO1xuXG5hcHAubGlzdGVuKHBvcnQpO1xuY29uc29sZS5sb2coJ1NlcnZlciBub3cgbGlzdGVuaW5nIG9uIHBvcnQgJyArIHBvcnQpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFwcDsiXX0=