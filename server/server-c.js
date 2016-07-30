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

//# sourceMappingURL=data:application/json;base64,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RCxFQUFRLGdCQUFSLEVBQTBCLFdBQTFCLEVBQTBDO0FBQzdFLFFBQUksS0FBSixFQUFXO0FBQ1QsVUFBSSxNQUFKLENBQVcsR0FBWCxFQUFnQixJQUFoQixDQUFxQixNQUFNLE9BQTNCO0FBQ0QsS0FGRCxNQUVPLElBQUksZ0JBQUosRUFBc0I7QUFDM0IsVUFBSSxRQUFKLENBQWEsR0FBYixFQUFrQixpQkFBaUIsUUFBakIsR0FBNEIsaUJBQWlCLE1BQS9EO0FBQ0QsS0FGTSxNQUVBLElBQUksV0FBSixFQUFpQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQSxVQUFJLE1BQUosQ0FBVyxHQUFYLEVBQWdCLElBQWhCLENBQXFCLDRCQUFlLDBEQUFtQixXQUFuQixDQUFmLENBQXJCO0FBQ0QsS0FMTSxNQUtBO0FBQ0wsVUFBSSxNQUFKLENBQVcsR0FBWCxFQUFnQixJQUFoQixDQUFxQixXQUFyQjtBQUNEO0FBQ0YsR0FiRDtBQWNELENBZkQ7O0FBaUJBLElBQUksT0FBTyxRQUFRLEdBQVIsQ0FBWSxJQUFaLElBQW9CLElBQS9COztBQUVBLElBQUksTUFBSixDQUFXLElBQVg7QUFDQSxRQUFRLEdBQVIsQ0FBWSxrQ0FBa0MsSUFBOUM7O0FBRUEsT0FBTyxPQUFQLEdBQWlCLEdBQWpCIiwiZmlsZSI6InNlcnZlci1jLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgYm9keVBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgbW9yZ2FuIGZyb20gJ21vcmdhbic7XG5pbXBvcnQgbW9uZ29vc2UgZnJvbSAnbW9uZ29vc2UnO1xuaW1wb3J0IFVzZXIgZnJvbSAnLi9tb2RlbHMvdXNlcic7XG5pbXBvcnQgU3RhY2tEYXRhIGZyb20gJy4vbW9kZWxzL3N0YWNrZGF0YSc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBjb3JzIGZyb20gJ2NvcnMnO1xuaW1wb3J0IGJjcnlwdCBmcm9tICdiY3J5cHQtbm9kZWpzJztcbmltcG9ydCBqd3QgZnJvbSAnand0LXNpbXBsZSc7XG5pbXBvcnQgc2VjcmV0IGZyb20gJy4vc2VjcmV0JztcbmltcG9ydCBwYXNzcG9ydEF1dGggZnJvbSAnLi9wYXNzcG9ydC9wYXNzcG9ydCc7XG5pbXBvcnQgbG9jYWxBdXRoIGZyb20gJy4vcGFzc3BvcnQvbG9jYWwnO1xuaW1wb3J0IGdpdGh1YiBmcm9tICcuL3Bhc3Nwb3J0L2dpdGh1Yic7XG5pbXBvcnQgcGFzc3BvcnQgZnJvbSAncGFzc3BvcnQnO1xuaW1wb3J0IGxvZ291dCBmcm9tICdleHByZXNzLXBhc3Nwb3J0LWxvZ291dCc7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgcmVuZGVyVG9TdHJpbmcgfSBmcm9tICdyZWFjdC1kb20vc2VydmVyJ1xuaW1wb3J0IHsgbWF0Y2gsIFJvdXRlckNvbnRleHQgfSBmcm9tICdyZWFjdC1yb3V0ZXInXG52YXIgcm91dGVzID0gcmVxdWlyZSgnLi9jb21waWxlZC9zcmMvYnVuZGxlJykuZGVmYXVsdDtcbnZhciBTRCA9IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvc3RhY2tkYXRhQ29udHJvbGxlcicpO1xuXG52YXIgYXBwID0gZXhwcmVzcygpO1xuXG5hcHAudXNlKG1vcmdhbignZGV2JykpO1xuYXBwLnVzZShib2R5UGFyc2VyLnVybGVuY29kZWQoeyBleHRlbmRlZDogdHJ1ZSB9KSk7XG5hcHAudXNlKGJvZHlQYXJzZXIuanNvbigpKTtcbmFwcC51c2UoZXhwcmVzcy5zdGF0aWMocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL2NsaWVudC9jb21waWxlZCcpKSk7XG5cblxuLy8gTW9uZ29vc2UgQ29ubmVjdGlvbiAoUmVmYWN0b3IgaW50byBTZXBhcmF0ZSBGaWxlKVxudmFyIGRhdGFiYXNlVVJMID0gcHJvY2Vzcy5lbnYuTU9OR09EQl9VUkkgfHwnbW9uZ29kYjovL2xvY2FsaG9zdDoyNzAxNy9zdGFjay1zYWxhcmllcydcblxubW9uZ29vc2UuY29ubmVjdChkYXRhYmFzZVVSTCk7XG5cbi8vIEhlbHBlciBNZXRob2RzIChSZWZhY3RvciBpbnRvIFNlcGFyYXRlIEZpbGUpXG5mdW5jdGlvbiBnZW5lcmF0ZVRva2VuKHVzZXIpe1xuICAvLyBBZGQgaXNzdWVkIGF0IHRpbWVzdGFtcCBhbmQgc3ViamVjdFxuICAvLyBCYXNlZCBvbiB0aGUgSldUIGNvbnZlbnRpb25cbiAgdmFyIHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICByZXR1cm4gand0LmVuY29kZSh7IHN1YjogdXNlci5pZCwgaWF0OiB0aW1lc3RhbXAgfSwgc2VjcmV0LnNlY3JldCk7XG59XG5cbi8vIFNldCB0byBmYWxzZSBzaW5jZSB0b2tlbnMgYXJlIGJlaW5nIHVzZWRcbi8vIFRoaXMgaXMgUGFzc3BvcnQgQXV0aGVudGljYXRpb24gc2V0dXBcbi8vIEdpdGh1YiBhdXRoIHdpbGwgYmUgYWRkZWQgaGVyZSBhcyB3ZWxsXG52YXIgcmVxdWlyZUF1dGggPSBwYXNzcG9ydC5hdXRoZW50aWNhdGUoJ2p3dCcsIHsgc2Vzc2lvbjogZmFsc2UgfSApO1xudmFyIHJlcXVpcmVTaWduSW4gPSBwYXNzcG9ydC5hdXRoZW50aWNhdGUoJ2xvY2FsJywgeyBzZXNzaW9uOiBmYWxzZSB9KTtcbnZhciBnaXRodWJBdXRoID0gcGFzc3BvcnQuYXV0aGVudGljYXRlKCdnaXRodWInLCB7IHNlc3Npb246IGZhbHNlLCBzdWNjZXNzUmVkaXJlY3Q6ICcvJywgZmFpbHVyZVJlZGlyZWN0OiAnL2xvZ2luJ30pO1xuXG4vLyBBbGxvdyBhbGwgaGVhZGVyc1xuYXBwLmFsbCgnKicsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB74oCoXG4gIHJlcy5oZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk74oCoXG4gIHJlcy5oZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnLCAnUFVULCBHRVQsIFBPU1QsIERFTEVURScpO+KAqFxuICByZXMuaGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJywgJ0NvbnRlbnQtVHlwZScpO+KAqFxuICBuZXh0KCk74oCoXG59KTtcblxuLy9TZWFyY2ggZm9yIGFueSBmaWVsZFxuYXBwLnBvc3QoJy9zZWFyY2gnLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICBTRC5xdWVyeVNhbGFyeShyZXEuYm9keSwgZnVuY3Rpb24ocmVzdWx0cykge1xuICAgIHJlcy5qc29uKHJlc3VsdHMpO1xuICB9KTtcbn0pO1xuXG4vLyBBZGQgYSBTdGFjayBFbnRyeVxuYXBwLnBvc3QoJy9zdGFja2VudHJ5JywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgU0QuY3JlYXRlU2FsYXJ5KHJlcS5ib2R5LCBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICByZXMuc3RhdHVzKDIwMSk7XG4gICAgcmVzLmpzb24ocmVzdWx0KTtcbiAgfSk7XG59KTtcblxuLy8gR0VUIGFsbCB1c2Vyc1xuYXBwLmdldCgnL3VzZXJzJywgcmVxdWlyZUF1dGgsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIFVzZXIuZmluZCh7fSwgZnVuY3Rpb24oZXJyLCB1c2Vycykge1xuICAgIGlmKCFlcnIpIHtcbiAgICAgIHJlcy5zZW5kKDIwMCwgdXNlcnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9KTtcbn0pO1xuXG5hcHAuZ2V0KCcvdXNlcnMvOmlkJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgdmFyIGlkID0gcmVxLnBhcmFtcy5pZDtcblxuICAvLyBBIGZyaWVuZGx5IGVycm9yIHRvIGRpc3BsYXkgaWYgbm8gdXNlciBtYXRjaGVzIHRoZSBpZFxuICB2YXIgZXJyID0gXCJObyBzdWNoIHVzZXIgd2l0aCB0aGUgZ2l2ZW4gaWRcIjtcblxuICAgVXNlci5maW5kT25lKHsgaWQ6IGlkfSwgZnVuY3Rpb24oZXJyLCBleGlzdGluZ1VzZXIpIHtcbiAgICBpZihlcnIpIHtcbiAgICAgIHJlcy5zZW5kKGVycik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcy5qc29uKGV4aXN0aW5nVXNlcik7XG4gICAgfVxuICAgfSk7XG59KTtcblxuLy8gVGhlIG1pZGRsZXdhcmUgd2lsbCB2ZXJpZnkgY3JlZGVudGlhbHNcbi8vIElmIHN1Y2Nlc3NmdWwsIGhhbmQgYSB0b2tlblxuYXBwLnBvc3QoJy9zaWduaW4nLCByZXF1aXJlU2lnbkluLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuXG4gIC8vIEdlbmVyYXRlIGEgdG9rZW5cbiAgdmFyIHRva2VuID0gZ2VuZXJhdGVUb2tlbihyZXEudXNlcik7XG5cbiAgLy8gU2VuZCB1c2VyIGJhY2sgYSBKV1QgdXBvbiBzdWNjZXNzZnVsIGFjY291bnQgY3JlYXRpb25cbiAgcmVzLmpzb24oe3VzZXI6IHJlcS51c2VyLCB0b2tlbjogdG9rZW59KTtcbn0pO1xuXG5hcHAucG9zdCgnL3NpZ251cCcsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIHZhciBuYW1lID0gcmVxLmJvZHkubmFtZTtcbiAgdmFyIGVtYWlsID0gcmVxLmJvZHkuZW1haWw7XG4gIHZhciBwYXNzd29yZCA9IHJlcS5ib2R5LnBhc3N3b3JkO1xuICB2YXIgZ2VuZGVyID0gcmVxLmJvZHkuZ2VuZGVyO1xuXG4gIC8vIFZhbGlkYXRpb24gdG8gY2hlY2sgaWYgYWxsIHRoZSBmaWVsZHMgd2VyZSBiZWluZyBwYXNzZWRcbiAgaWYoIWVtYWlsIHx8ICFwYXNzd29yZCB8fCAhbmFtZSl7XG4gICAgcmV0dXJuIHJlcy5zZW5kKDQyMiwge2Vycm9yOiBcIlBsZWFzZSBmaWxsIG91dCBhbGwgdGhlIGZpZWxkc1wifSk7XG4gIH1cblxuICAvLyBDaGVjayBlbWFpbCBhbHJlYWR5IGV4aXN0c1xuICBVc2VyLmZpbmRPbmUoeyBlbWFpbDogZW1haWx9LCBmdW5jdGlvbihlcnIsIGV4aXN0aW5nVXNlcikge1xuXG4gICAgaWYoZXJyKSB7IHJldHVybiBuZXh0KGVycik7IH1cblxuICAgIC8vIElmIGl0IGRvZXMsIHJldHVybiBcImV4aXN0aW5nIGFjY291bnRcIiBtZXNzYWdlXG4gICAgaWYoZXhpc3RpbmdVc2VyKXtcbiAgICAgIC8vIFJldHVybiB1bnByb2Nlc3NhYmxlIGVudGl0eVxuICAgICAgcmV0dXJuIHJlcy5zZW5kKDQyMiwgeyBlcnJvcjogJ0VtYWlsIGlzIGluIHVzZScgfSk7XG4gICAgfVxuXG4gICAgLy8gSWYgbm90LCBjcmVhdGUgYW5kIHNhdmUgdXNlclxuICAgIHZhciB1c2VyID0gbmV3IFVzZXIoe1xuICAgICAgbmFtZTogbmFtZSxcbiAgICAgIGVtYWlsOiBlbWFpbCxcbiAgICAgIHBhc3N3b3JkOiBwYXNzd29yZCxcbiAgICAgIGdlbmRlcjogZ2VuZGVyXG4gICAgfSk7XG5cbiAgICB1c2VyLnNhdmUoZnVuY3Rpb24oZXJyKXtcbiAgICAgIGlmIChlcnIpIHsgcmV0dXJuIG5leHQoZXJyKTsgfVxuXG4gICAgICAvLyBHZW5lcmF0ZSBhIHRva2VuXG4gICAgICB2YXIgdG9rZW4gPSBnZW5lcmF0ZVRva2VuKHVzZXIpO1xuXG4gICAgICAvLyBTZW5kIHVzZXIgYmFjayBhIEpXVCB1cG9uIHN1Y2Nlc3NmdWwgYWNjb3VudCBjcmVhdGlvblxuICAgICAgcmVzLmpzb24oe3VzZXI6IHVzZXIsIHRva2VuOiB0b2tlbn0pO1xuICAgIH0pO1xuXG4gIH0pO1xuXG59KTtcblxuLy8gTG9nIG91dCBhIHVzZXJcbi8vIE5vdGUsIFJlYWN0IFJvdXRlciBpcyBjdXJyZW50bHkgaGFuZGxpbmcgdGhpc1xuYXBwLmdldCgnL2xvZ291dCcsIGxvZ291dCgpLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCl7XG4gIHJlcy5yZWRpcmVjdCgnL2xvZ2luJyk7XG59KTtcblxuLy8gUm9vdCBQYXRoXG5hcHAuZ2V0KCcqJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgbWF0Y2goeyByb3V0ZXMsIGxvY2F0aW9uOiByZXEudXJsIH0sIChlcnJvciwgcmVkaXJlY3RMb2NhdGlvbiwgcmVuZGVyUHJvcHMpID0+IHtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIHJlcy5zdGF0dXMoNTAwKS5zZW5kKGVycm9yLm1lc3NhZ2UpXG4gICAgfSBlbHNlIGlmIChyZWRpcmVjdExvY2F0aW9uKSB7XG4gICAgICByZXMucmVkaXJlY3QoMzAyLCByZWRpcmVjdExvY2F0aW9uLnBhdGhuYW1lICsgcmVkaXJlY3RMb2NhdGlvbi5zZWFyY2gpXG4gICAgfSBlbHNlIGlmIChyZW5kZXJQcm9wcykge1xuICAgICAgLy8gWW91IGNhbiBhbHNvIGNoZWNrIHJlbmRlclByb3BzLmNvbXBvbmVudHMgb3IgcmVuZGVyUHJvcHMucm91dGVzIGZvclxuICAgICAgLy8geW91ciBcIm5vdCBmb3VuZFwiIGNvbXBvbmVudCBvciByb3V0ZSByZXNwZWN0aXZlbHksIGFuZCBzZW5kIGEgNDA0IGFzXG4gICAgICAvLyBiZWxvdywgaWYgeW91J3JlIHVzaW5nIGEgY2F0Y2gtYWxsIHJvdXRlLlxuICAgICAgcmVzLnN0YXR1cygyMDApLnNlbmQocmVuZGVyVG9TdHJpbmcoPFJvdXRlckNvbnRleHQgey4uLnJlbmRlclByb3BzfSAvPikpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcy5zdGF0dXMoNDA0KS5zZW5kKCdOb3QgZm91bmQnKVxuICAgIH1cbiAgfSlcbn0pO1xuXG52YXIgcG9ydCA9IHByb2Nlc3MuZW52LlBPUlQgfHwgMzAwMDtcblxuYXBwLmxpc3Rlbihwb3J0KTtcbmNvbnNvbGUubG9nKCdTZXJ2ZXIgbm93IGxpc3RlbmluZyBvbiBwb3J0ICcgKyBwb3J0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBhcHA7Il19