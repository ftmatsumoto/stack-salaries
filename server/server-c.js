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
var databaseURL = process.env.MONGOLABS || 'mongodb://localhost:27017/stack-salaries';

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

//# sourceMappingURL=data:application/json;base64,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M0I7QUFDRCxLQUZELE1BRU8sSUFBSSxnQkFBSixFQUFzQjtBQUMzQixVQUFJLFFBQUosQ0FBYSxHQUFiLEVBQWtCLGlCQUFpQixRQUFqQixHQUE0QixpQkFBaUIsTUFBL0Q7QUFDRCxLQUZNLE1BRUEsSUFBSSxXQUFKLEVBQWlCOzs7O0FBSXRCLFVBQUksTUFBSixDQUFXLEdBQVgsRUFBZ0IsSUFBaEIsQ0FBcUIsNEJBQWUsMERBQW1CLFdBQW5CLENBQWYsQ0FBckI7QUFDRCxLQUxNLE1BS0E7QUFDTCxVQUFJLE1BQUosQ0FBVyxHQUFYLEVBQWdCLElBQWhCLENBQXFCLFdBQXJCO0FBQ0Q7QUFDRixHQWJEO0FBY0QsQ0FmRDs7QUFpQkEsSUFBSSxPQUFPLFFBQVEsR0FBUixDQUFZLElBQVosSUFBb0IsSUFBL0I7O0FBRUEsSUFBSSxNQUFKLENBQVcsSUFBWDtBQUNBLFFBQVEsR0FBUixDQUFZLGtDQUFrQyxJQUE5Qzs7QUFFQSxPQUFPLE9BQVAsR0FBaUIsR0FBakIiLCJmaWxlIjoic2VydmVyLWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZXhwcmVzcyBmcm9tICdleHByZXNzJztcbmltcG9ydCBib2R5UGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcbmltcG9ydCBtb3JnYW4gZnJvbSAnbW9yZ2FuJztcbmltcG9ydCBtb25nb29zZSBmcm9tICdtb25nb29zZSc7XG5pbXBvcnQgVXNlciBmcm9tICcuL21vZGVscy91c2VyJztcbmltcG9ydCBTdGFja0RhdGEgZnJvbSAnLi9tb2RlbHMvc3RhY2tkYXRhJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGNvcnMgZnJvbSAnY29ycyc7XG5pbXBvcnQgYmNyeXB0IGZyb20gJ2JjcnlwdC1ub2RlanMnO1xuaW1wb3J0IGp3dCBmcm9tICdqd3Qtc2ltcGxlJztcbmltcG9ydCBzZWNyZXQgZnJvbSAnLi9zZWNyZXQnO1xuaW1wb3J0IHBhc3Nwb3J0QXV0aCBmcm9tICcuL3Bhc3Nwb3J0L3Bhc3Nwb3J0JztcbmltcG9ydCBsb2NhbEF1dGggZnJvbSAnLi9wYXNzcG9ydC9sb2NhbCc7XG5pbXBvcnQgZ2l0aHViIGZyb20gJy4vcGFzc3BvcnQvZ2l0aHViJztcbmltcG9ydCBwYXNzcG9ydCBmcm9tICdwYXNzcG9ydCc7XG5pbXBvcnQgbG9nb3V0IGZyb20gJ2V4cHJlc3MtcGFzc3BvcnQtbG9nb3V0JztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyByZW5kZXJUb1N0cmluZyB9IGZyb20gJ3JlYWN0LWRvbS9zZXJ2ZXInXG5pbXBvcnQgeyBtYXRjaCwgUm91dGVyQ29udGV4dCB9IGZyb20gJ3JlYWN0LXJvdXRlcidcbnZhciByb3V0ZXMgPSByZXF1aXJlKCcuL2NvbXBpbGVkL3NyYy9idW5kbGUnKS5kZWZhdWx0O1xudmFyIFNEID0gcmVxdWlyZSgnLi9jb250cm9sbGVycy9zdGFja2RhdGFDb250cm9sbGVyJyk7XG5cbnZhciBhcHAgPSBleHByZXNzKCk7XG5cbmFwcC51c2UobW9yZ2FuKCdkZXYnKSk7XG5hcHAudXNlKGJvZHlQYXJzZXIudXJsZW5jb2RlZCh7IGV4dGVuZGVkOiB0cnVlIH0pKTtcbmFwcC51c2UoYm9keVBhcnNlci5qc29uKCkpO1xuYXBwLnVzZShleHByZXNzLnN0YXRpYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vY2xpZW50L2NvbXBpbGVkJykpKTtcblxuXG4vLyBNb25nb29zZSBDb25uZWN0aW9uIChSZWZhY3RvciBpbnRvIFNlcGFyYXRlIEZpbGUpXG52YXIgZGF0YWJhc2VVUkwgPSBwcm9jZXNzLmVudi5NT05HT0xBQlMgfHwnbW9uZ29kYjovL2xvY2FsaG9zdDoyNzAxNy9zdGFjay1zYWxhcmllcydcblxubW9uZ29vc2UuY29ubmVjdChkYXRhYmFzZVVSTCk7XG5cbi8vIEhlbHBlciBNZXRob2RzIChSZWZhY3RvciBpbnRvIFNlcGFyYXRlIEZpbGUpXG5mdW5jdGlvbiBnZW5lcmF0ZVRva2VuKHVzZXIpe1xuICAvLyBBZGQgaXNzdWVkIGF0IHRpbWVzdGFtcCBhbmQgc3ViamVjdFxuICAvLyBCYXNlZCBvbiB0aGUgSldUIGNvbnZlbnRpb25cbiAgdmFyIHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICByZXR1cm4gand0LmVuY29kZSh7IHN1YjogdXNlci5pZCwgaWF0OiB0aW1lc3RhbXAgfSwgc2VjcmV0LnNlY3JldCk7XG59XG5cbi8vIFNldCB0byBmYWxzZSBzaW5jZSB0b2tlbnMgYXJlIGJlaW5nIHVzZWRcbi8vIFRoaXMgaXMgUGFzc3BvcnQgQXV0aGVudGljYXRpb24gc2V0dXBcbi8vIEdpdGh1YiBhdXRoIHdpbGwgYmUgYWRkZWQgaGVyZSBhcyB3ZWxsXG52YXIgcmVxdWlyZUF1dGggPSBwYXNzcG9ydC5hdXRoZW50aWNhdGUoJ2p3dCcsIHsgc2Vzc2lvbjogZmFsc2UgfSApO1xudmFyIHJlcXVpcmVTaWduSW4gPSBwYXNzcG9ydC5hdXRoZW50aWNhdGUoJ2xvY2FsJywgeyBzZXNzaW9uOiBmYWxzZSB9KTtcbnZhciBnaXRodWJBdXRoID0gcGFzc3BvcnQuYXV0aGVudGljYXRlKCdnaXRodWInLCB7IHNlc3Npb246IGZhbHNlLCBzdWNjZXNzUmVkaXJlY3Q6ICcvJywgZmFpbHVyZVJlZGlyZWN0OiAnL2xvZ2luJ30pO1xuXG4vLyBBbGxvdyBhbGwgaGVhZGVyc1xuYXBwLmFsbCgnKicsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB74oCoXG4gIHJlcy5oZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk74oCoXG4gIHJlcy5oZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnLCAnUFVULCBHRVQsIFBPU1QsIERFTEVURScpO+KAqFxuICByZXMuaGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJywgJ0NvbnRlbnQtVHlwZScpO+KAqFxuICBuZXh0KCk74oCoXG59KTtcblxuLy9TZWFyY2ggZm9yIGFueSBmaWVsZFxuYXBwLnBvc3QoJy9zZWFyY2gnLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICBTRC5xdWVyeVNhbGFyeShyZXEuYm9keSwgZnVuY3Rpb24ocmVzdWx0cykge1xuICAgIHJlcy5qc29uKHJlc3VsdHMpO1xuICB9KTtcbn0pO1xuXG4vLyBBZGQgYSBTdGFjayBFbnRyeVxuYXBwLnBvc3QoJy9zdGFja2VudHJ5JywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgU0QuY3JlYXRlU2FsYXJ5KHJlcS5ib2R5LCBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICByZXMuc3RhdHVzKDIwMSk7XG4gICAgcmVzLmpzb24ocmVzdWx0KTtcbiAgfSk7XG59KTtcblxuLy8gR0VUIGFsbCB1c2Vyc1xuYXBwLmdldCgnL3VzZXJzJywgcmVxdWlyZUF1dGgsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIFVzZXIuZmluZCh7fSwgZnVuY3Rpb24oZXJyLCB1c2Vycykge1xuICAgIGlmKCFlcnIpIHtcbiAgICAgIHJlcy5zZW5kKDIwMCwgdXNlcnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9KTtcbn0pO1xuXG5hcHAuZ2V0KCcvdXNlcnMvOmlkJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgdmFyIGlkID0gcmVxLnBhcmFtcy5pZDtcblxuICAvLyBBIGZyaWVuZGx5IGVycm9yIHRvIGRpc3BsYXkgaWYgbm8gdXNlciBtYXRjaGVzIHRoZSBpZFxuICB2YXIgZXJyID0gXCJObyBzdWNoIHVzZXIgd2l0aCB0aGUgZ2l2ZW4gaWRcIjtcblxuICAgVXNlci5maW5kT25lKHsgaWQ6IGlkfSwgZnVuY3Rpb24oZXJyLCBleGlzdGluZ1VzZXIpIHtcbiAgICBpZihlcnIpIHtcbiAgICAgIHJlcy5zZW5kKGVycik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcy5qc29uKGV4aXN0aW5nVXNlcik7XG4gICAgfVxuICAgfSk7XG59KTtcblxuLy8gVGhlIG1pZGRsZXdhcmUgd2lsbCB2ZXJpZnkgY3JlZGVudGlhbHNcbi8vIElmIHN1Y2Nlc3NmdWwsIGhhbmQgYSB0b2tlblxuYXBwLnBvc3QoJy9zaWduaW4nLCByZXF1aXJlU2lnbkluLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuXG4gIC8vIEdlbmVyYXRlIGEgdG9rZW5cbiAgdmFyIHRva2VuID0gZ2VuZXJhdGVUb2tlbihyZXEudXNlcik7XG5cbiAgLy8gU2VuZCB1c2VyIGJhY2sgYSBKV1QgdXBvbiBzdWNjZXNzZnVsIGFjY291bnQgY3JlYXRpb25cbiAgcmVzLmpzb24oe3VzZXI6IHJlcS51c2VyLCB0b2tlbjogdG9rZW59KTtcbn0pO1xuXG5hcHAucG9zdCgnL3NpZ251cCcsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIHZhciBuYW1lID0gcmVxLmJvZHkubmFtZTtcbiAgdmFyIGVtYWlsID0gcmVxLmJvZHkuZW1haWw7XG4gIHZhciBwYXNzd29yZCA9IHJlcS5ib2R5LnBhc3N3b3JkO1xuICB2YXIgZ2VuZGVyID0gcmVxLmJvZHkuZ2VuZGVyO1xuXG4gIC8vIFZhbGlkYXRpb24gdG8gY2hlY2sgaWYgYWxsIHRoZSBmaWVsZHMgd2VyZSBiZWluZyBwYXNzZWRcbiAgaWYoIWVtYWlsIHx8ICFwYXNzd29yZCB8fCAhbmFtZSl7XG4gICAgcmV0dXJuIHJlcy5zZW5kKDQyMiwge2Vycm9yOiBcIlBsZWFzZSBmaWxsIG91dCBhbGwgdGhlIGZpZWxkc1wifSk7XG4gIH1cblxuICAvLyBDaGVjayBlbWFpbCBhbHJlYWR5IGV4aXN0c1xuICBVc2VyLmZpbmRPbmUoeyBlbWFpbDogZW1haWx9LCBmdW5jdGlvbihlcnIsIGV4aXN0aW5nVXNlcikge1xuXG4gICAgaWYoZXJyKSB7IHJldHVybiBuZXh0KGVycik7IH1cblxuICAgIC8vIElmIGl0IGRvZXMsIHJldHVybiBcImV4aXN0aW5nIGFjY291bnRcIiBtZXNzYWdlXG4gICAgaWYoZXhpc3RpbmdVc2VyKXtcbiAgICAgIC8vIFJldHVybiB1bnByb2Nlc3NhYmxlIGVudGl0eVxuICAgICAgcmV0dXJuIHJlcy5zZW5kKDQyMiwgeyBlcnJvcjogJ0VtYWlsIGlzIGluIHVzZScgfSk7XG4gICAgfVxuXG4gICAgLy8gSWYgbm90LCBjcmVhdGUgYW5kIHNhdmUgdXNlclxuICAgIHZhciB1c2VyID0gbmV3IFVzZXIoe1xuICAgICAgbmFtZTogbmFtZSxcbiAgICAgIGVtYWlsOiBlbWFpbCxcbiAgICAgIHBhc3N3b3JkOiBwYXNzd29yZCxcbiAgICAgIGdlbmRlcjogZ2VuZGVyXG4gICAgfSk7XG5cbiAgICB1c2VyLnNhdmUoZnVuY3Rpb24oZXJyKXtcbiAgICAgIGlmIChlcnIpIHsgcmV0dXJuIG5leHQoZXJyKTsgfVxuXG4gICAgICAvLyBHZW5lcmF0ZSBhIHRva2VuXG4gICAgICB2YXIgdG9rZW4gPSBnZW5lcmF0ZVRva2VuKHVzZXIpO1xuXG4gICAgICAvLyBTZW5kIHVzZXIgYmFjayBhIEpXVCB1cG9uIHN1Y2Nlc3NmdWwgYWNjb3VudCBjcmVhdGlvblxuICAgICAgcmVzLmpzb24oe3VzZXI6IHVzZXIsIHRva2VuOiB0b2tlbn0pO1xuICAgIH0pO1xuXG4gIH0pO1xuXG59KTtcblxuLy8gTG9nIG91dCBhIHVzZXJcbi8vIE5vdGUsIFJlYWN0IFJvdXRlciBpcyBjdXJyZW50bHkgaGFuZGxpbmcgdGhpc1xuYXBwLmdldCgnL2xvZ291dCcsIGxvZ291dCgpLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCl7XG4gIHJlcy5yZWRpcmVjdCgnL2xvZ2luJyk7XG59KTtcblxuLy8gUm9vdCBQYXRoXG5hcHAuZ2V0KCcqJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgbWF0Y2goeyByb3V0ZXMsIGxvY2F0aW9uOiByZXEudXJsIH0sIChlcnJvciwgcmVkaXJlY3RMb2NhdGlvbiwgcmVuZGVyUHJvcHMpID0+IHtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIHJlcy5zdGF0dXMoNTAwKS5zZW5kKGVycm9yLm1lc3NhZ2UpXG4gICAgfSBlbHNlIGlmIChyZWRpcmVjdExvY2F0aW9uKSB7XG4gICAgICByZXMucmVkaXJlY3QoMzAyLCByZWRpcmVjdExvY2F0aW9uLnBhdGhuYW1lICsgcmVkaXJlY3RMb2NhdGlvbi5zZWFyY2gpXG4gICAgfSBlbHNlIGlmIChyZW5kZXJQcm9wcykge1xuICAgICAgLy8gWW91IGNhbiBhbHNvIGNoZWNrIHJlbmRlclByb3BzLmNvbXBvbmVudHMgb3IgcmVuZGVyUHJvcHMucm91dGVzIGZvclxuICAgICAgLy8geW91ciBcIm5vdCBmb3VuZFwiIGNvbXBvbmVudCBvciByb3V0ZSByZXNwZWN0aXZlbHksIGFuZCBzZW5kIGEgNDA0IGFzXG4gICAgICAvLyBiZWxvdywgaWYgeW91J3JlIHVzaW5nIGEgY2F0Y2gtYWxsIHJvdXRlLlxuICAgICAgcmVzLnN0YXR1cygyMDApLnNlbmQocmVuZGVyVG9TdHJpbmcoPFJvdXRlckNvbnRleHQgey4uLnJlbmRlclByb3BzfSAvPikpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcy5zdGF0dXMoNDA0KS5zZW5kKCdOb3QgZm91bmQnKVxuICAgIH1cbiAgfSlcbn0pO1xuXG52YXIgcG9ydCA9IHByb2Nlc3MuZW52LlBPUlQgfHwgMzAwMDtcblxuYXBwLmxpc3Rlbihwb3J0KTtcbmNvbnNvbGUubG9nKCdTZXJ2ZXIgbm93IGxpc3RlbmluZyBvbiBwb3J0ICcgKyBwb3J0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBhcHA7Il19