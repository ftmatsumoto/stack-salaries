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
  // console.log(req.body);
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

// GET data from one user
// finding user by name:"aaaaa", change after add token to database
app.get('/user', function (req, res, next) {
  _user2.default.find({ token: req.query.token }, function (err, user) {
    if (err) {
      console.log(err);
    }
    res.status(200).send(user);
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
      gender: gender,
      token: null,
      firstSave: true
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

app.post('/savetoken', function (req, res, next) {
  _user2.default.findOne({ email: req.body.email }, function (err, user) {
    if (err) {
      return next(err);
    }
    console.log('SAVE TOKEN', req.body.token);
    user.token = req.body.token;
    user.save(function (err) {
      if (err) {
        return next(err);
      }
      res.json({ user: user });
    });
  });
});

app.post('/loggedIn', function (req, res, next) {
  _user2.default.findOne({ token: req.body.token }, function (err, user) {
    if (err) {
      return next(err);
    }
    res.json({ user: user });
  });
});

// Log out a user
// Note, React Router is currently handling this
app.post('/logout', function (req, res, next) {
  _user2.default.findOne({ token: req.body.token }, function (err, user) {
    if (user) {
      user.token = null;
      user.save(function (err) {
        if (err) {
          return next(err);
        }
        res.json({ deleted: true });
      });
    } else {
      res.json({ deleted: false });
    }
  });
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

//# sourceMappingURL=data:application/json;base64,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LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgYm9keVBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgbW9yZ2FuIGZyb20gJ21vcmdhbic7XG5pbXBvcnQgbW9uZ29vc2UgZnJvbSAnbW9uZ29vc2UnO1xuaW1wb3J0IFVzZXIgZnJvbSAnLi9tb2RlbHMvdXNlcic7XG5pbXBvcnQgU3RhY2tEYXRhIGZyb20gJy4vbW9kZWxzL3N0YWNrZGF0YSc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBjb3JzIGZyb20gJ2NvcnMnO1xuaW1wb3J0IGJjcnlwdCBmcm9tICdiY3J5cHQtbm9kZWpzJztcbmltcG9ydCBqd3QgZnJvbSAnand0LXNpbXBsZSc7XG5pbXBvcnQgc2VjcmV0IGZyb20gJy4vc2VjcmV0JztcbmltcG9ydCBwYXNzcG9ydEF1dGggZnJvbSAnLi9wYXNzcG9ydC9wYXNzcG9ydCc7XG5pbXBvcnQgbG9jYWxBdXRoIGZyb20gJy4vcGFzc3BvcnQvbG9jYWwnO1xuaW1wb3J0IGdpdGh1YiBmcm9tICcuL3Bhc3Nwb3J0L2dpdGh1Yic7XG5pbXBvcnQgcGFzc3BvcnQgZnJvbSAncGFzc3BvcnQnO1xuaW1wb3J0IGxvZ291dCBmcm9tICdleHByZXNzLXBhc3Nwb3J0LWxvZ291dCc7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgcmVuZGVyVG9TdHJpbmcgfSBmcm9tICdyZWFjdC1kb20vc2VydmVyJ1xuaW1wb3J0IHsgbWF0Y2gsIFJvdXRlckNvbnRleHQgfSBmcm9tICdyZWFjdC1yb3V0ZXInXG52YXIgcm91dGVzID0gcmVxdWlyZSgnLi9jb21waWxlZC9zcmMvYnVuZGxlJykuZGVmYXVsdDtcbnZhciBTRCA9IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvc3RhY2tkYXRhQ29udHJvbGxlcicpO1xuXG52YXIgYXBwID0gZXhwcmVzcygpO1xuXG5hcHAudXNlKG1vcmdhbignZGV2JykpO1xuYXBwLnVzZShib2R5UGFyc2VyLnVybGVuY29kZWQoeyBleHRlbmRlZDogdHJ1ZSB9KSk7XG5hcHAudXNlKGJvZHlQYXJzZXIuanNvbigpKTtcbmFwcC51c2UoZXhwcmVzcy5zdGF0aWMocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL2NsaWVudC9jb21waWxlZCcpKSk7XG5cblxuLy8gTW9uZ29vc2UgQ29ubmVjdGlvbiAoUmVmYWN0b3IgaW50byBTZXBhcmF0ZSBGaWxlKVxudmFyIGRhdGFiYXNlVVJMID0gcHJvY2Vzcy5lbnYuTU9OR09EQl9VUkkgfHwnbW9uZ29kYjovL2xvY2FsaG9zdDoyNzAxNy9zdGFjay1zYWxhcmllcydcblxubW9uZ29vc2UuY29ubmVjdChkYXRhYmFzZVVSTCk7XG5cbi8vIEhlbHBlciBNZXRob2RzIChSZWZhY3RvciBpbnRvIFNlcGFyYXRlIEZpbGUpXG5mdW5jdGlvbiBnZW5lcmF0ZVRva2VuKHVzZXIpe1xuICAvLyBBZGQgaXNzdWVkIGF0IHRpbWVzdGFtcCBhbmQgc3ViamVjdFxuICAvLyBCYXNlZCBvbiB0aGUgSldUIGNvbnZlbnRpb25cbiAgdmFyIHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICByZXR1cm4gand0LmVuY29kZSh7IHN1YjogdXNlci5pZCwgaWF0OiB0aW1lc3RhbXAgfSwgc2VjcmV0LnNlY3JldCk7XG59XG5cbi8vIFNldCB0byBmYWxzZSBzaW5jZSB0b2tlbnMgYXJlIGJlaW5nIHVzZWRcbi8vIFRoaXMgaXMgUGFzc3BvcnQgQXV0aGVudGljYXRpb24gc2V0dXBcbi8vIEdpdGh1YiBhdXRoIHdpbGwgYmUgYWRkZWQgaGVyZSBhcyB3ZWxsXG52YXIgcmVxdWlyZUF1dGggPSBwYXNzcG9ydC5hdXRoZW50aWNhdGUoJ2p3dCcsIHsgc2Vzc2lvbjogZmFsc2UgfSApO1xudmFyIHJlcXVpcmVTaWduSW4gPSBwYXNzcG9ydC5hdXRoZW50aWNhdGUoJ2xvY2FsJywgeyBzZXNzaW9uOiBmYWxzZSB9KTtcbnZhciBnaXRodWJBdXRoID0gcGFzc3BvcnQuYXV0aGVudGljYXRlKCdnaXRodWInLCB7IHNlc3Npb246IGZhbHNlLCBzdWNjZXNzUmVkaXJlY3Q6ICcvJywgZmFpbHVyZVJlZGlyZWN0OiAnL2xvZ2luJ30pO1xuXG4vLyBBbGxvdyBhbGwgaGVhZGVyc1xuYXBwLmFsbCgnKicsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB74oCoXG4gIHJlcy5oZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk74oCoXG4gIHJlcy5oZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnLCAnUFVULCBHRVQsIFBPU1QsIERFTEVURScpO+KAqFxuICByZXMuaGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJywgJ0NvbnRlbnQtVHlwZScpO+KAqFxuICBuZXh0KCk74oCoXG59KTtcblxuLy9TZWFyY2ggZm9yIGFueSBmaWVsZFxuYXBwLnBvc3QoJy9zZWFyY2gnLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICBTRC5xdWVyeVNhbGFyeShyZXEuYm9keSwgZnVuY3Rpb24ocmVzdWx0cykge1xuICAgIHJlcy5qc29uKHJlc3VsdHMpO1xuICB9KTtcbn0pO1xuXG4vLyBBZGQgYSBTdGFjayBFbnRyeVxuYXBwLnBvc3QoJy9zdGFja2VudHJ5JywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgLy8gY29uc29sZS5sb2cocmVxLmJvZHkpO1xuICBTRC5jcmVhdGVTYWxhcnkocmVxLmJvZHksIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgIHJlcy5zdGF0dXMoMjAxKTtcbiAgICByZXMuanNvbihyZXN1bHQpO1xuICB9KTtcbn0pO1xuXG4vLyBHRVQgYWxsIHVzZXJzXG5hcHAuZ2V0KCcvdXNlcnMnLCByZXF1aXJlQXV0aCwgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgVXNlci5maW5kKHt9LCBmdW5jdGlvbihlcnIsIHVzZXJzKSB7XG4gICAgaWYoIWVycikge1xuICAgICAgcmVzLnNlbmQoMjAwLCB1c2Vycyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH0pO1xufSk7XG5cbi8vIEdFVCBkYXRhIGZyb20gb25lIHVzZXJcbi8vIGZpbmRpbmcgdXNlciBieSBuYW1lOlwiYWFhYWFcIiwgY2hhbmdlIGFmdGVyIGFkZCB0b2tlbiB0byBkYXRhYmFzZVxuYXBwLmdldCgnL3VzZXInLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICBVc2VyLmZpbmQoe3Rva2VuOiByZXEucXVlcnkudG9rZW59LCBmdW5jdGlvbihlcnIsIHVzZXIpIHtcbiAgICBpZiAoZXJyKSB7Y29uc29sZS5sb2coZXJyKTt9XG4gICAgcmVzLnN0YXR1cygyMDApLnNlbmQodXNlcik7XG4gIH0pO1xufSk7XG5cbmFwcC5nZXQoJy91c2Vycy86aWQnLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICB2YXIgaWQgPSByZXEucGFyYW1zLmlkO1xuXG4gIC8vIEEgZnJpZW5kbHkgZXJyb3IgdG8gZGlzcGxheSBpZiBubyB1c2VyIG1hdGNoZXMgdGhlIGlkXG4gIHZhciBlcnIgPSBcIk5vIHN1Y2ggdXNlciB3aXRoIHRoZSBnaXZlbiBpZFwiO1xuXG4gICBVc2VyLmZpbmRPbmUoeyBpZDogaWR9LCBmdW5jdGlvbihlcnIsIGV4aXN0aW5nVXNlcikge1xuICAgIGlmKGVycikge1xuICAgICAgcmVzLnNlbmQoZXJyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzLmpzb24oZXhpc3RpbmdVc2VyKTtcbiAgICB9XG4gICB9KTtcbn0pO1xuXG4vLyBUaGUgbWlkZGxld2FyZSB3aWxsIHZlcmlmeSBjcmVkZW50aWFsc1xuLy8gSWYgc3VjY2Vzc2Z1bCwgaGFuZCBhIHRva2VuXG5hcHAucG9zdCgnL3NpZ25pbicsIHJlcXVpcmVTaWduSW4sIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG5cbiAgLy8gR2VuZXJhdGUgYSB0b2tlblxuICB2YXIgdG9rZW4gPSBnZW5lcmF0ZVRva2VuKHJlcS51c2VyKTtcblxuICAvLyBTZW5kIHVzZXIgYmFjayBhIEpXVCB1cG9uIHN1Y2Nlc3NmdWwgYWNjb3VudCBjcmVhdGlvblxuICByZXMuanNvbih7dXNlcjogcmVxLnVzZXIsIHRva2VuOiB0b2tlbn0pO1xufSk7XG5cbmFwcC5wb3N0KCcvc2lnbnVwJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgdmFyIG5hbWUgPSByZXEuYm9keS5uYW1lO1xuICB2YXIgZW1haWwgPSByZXEuYm9keS5lbWFpbDtcbiAgdmFyIHBhc3N3b3JkID0gcmVxLmJvZHkucGFzc3dvcmQ7XG4gIHZhciBnZW5kZXIgPSByZXEuYm9keS5nZW5kZXI7XG5cbiAgLy8gVmFsaWRhdGlvbiB0byBjaGVjayBpZiBhbGwgdGhlIGZpZWxkcyB3ZXJlIGJlaW5nIHBhc3NlZFxuICBpZighZW1haWwgfHwgIXBhc3N3b3JkIHx8ICFuYW1lKXtcbiAgICByZXR1cm4gcmVzLnNlbmQoNDIyLCB7ZXJyb3I6IFwiUGxlYXNlIGZpbGwgb3V0IGFsbCB0aGUgZmllbGRzXCJ9KTtcbiAgfVxuXG4gIC8vIENoZWNrIGVtYWlsIGFscmVhZHkgZXhpc3RzXG4gIFVzZXIuZmluZE9uZSh7IGVtYWlsOiBlbWFpbH0sIGZ1bmN0aW9uKGVyciwgZXhpc3RpbmdVc2VyKSB7XG5cbiAgICBpZihlcnIpIHsgcmV0dXJuIG5leHQoZXJyKTsgfVxuXG4gICAgLy8gSWYgaXQgZG9lcywgcmV0dXJuIFwiZXhpc3RpbmcgYWNjb3VudFwiIG1lc3NhZ2VcbiAgICBpZihleGlzdGluZ1VzZXIpe1xuICAgICAgLy8gUmV0dXJuIHVucHJvY2Vzc2FibGUgZW50aXR5XG4gICAgICByZXR1cm4gcmVzLnNlbmQoNDIyLCB7IGVycm9yOiAnRW1haWwgaXMgaW4gdXNlJyB9KTtcbiAgICB9XG5cbiAgICAvLyBJZiBub3QsIGNyZWF0ZSBhbmQgc2F2ZSB1c2VyXG4gICAgdmFyIHVzZXIgPSBuZXcgVXNlcih7XG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgZW1haWw6IGVtYWlsLFxuICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxuICAgICAgZ2VuZGVyOiBnZW5kZXIsXG4gICAgICB0b2tlbjogbnVsbCxcbiAgICAgIGZpcnN0U2F2ZTogdHJ1ZVxuICAgIH0pO1xuXG4gICAgdXNlci5zYXZlKGZ1bmN0aW9uKGVycil7XG4gICAgICBpZiAoZXJyKSB7IHJldHVybiBuZXh0KGVycik7IH1cblxuICAgICAgLy8gR2VuZXJhdGUgYSB0b2tlblxuICAgICAgdmFyIHRva2VuID0gZ2VuZXJhdGVUb2tlbih1c2VyKTtcblxuICAgICAgLy8gU2VuZCB1c2VyIGJhY2sgYSBKV1QgdXBvbiBzdWNjZXNzZnVsIGFjY291bnQgY3JlYXRpb25cbiAgICAgIHJlcy5qc29uKHt1c2VyOiB1c2VyLCB0b2tlbjogdG9rZW59KTtcbiAgICB9KTtcblxuICB9KTtcblxufSk7XG5cbmFwcC5wb3N0KCcvc2F2ZXRva2VuJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgVXNlci5maW5kT25lKHtlbWFpbDogcmVxLmJvZHkuZW1haWx9LCBmdW5jdGlvbihlcnIsIHVzZXIpIHtcbiAgICBpZiAoZXJyKSB7IHJldHVybiBuZXh0KGVycikgfVxuICAgIGNvbnNvbGUubG9nKCdTQVZFIFRPS0VOJywgcmVxLmJvZHkudG9rZW4pO1xuICAgIHVzZXIudG9rZW4gPSByZXEuYm9keS50b2tlbjtcbiAgICB1c2VyLnNhdmUoZnVuY3Rpb24oZXJyKSB7XG4gICAgICBpZiAoZXJyKSB7IHJldHVybiBuZXh0KGVycikgfVxuICAgICAgcmVzLmpzb24oe3VzZXJ9KTtcbiAgICB9KVxuICB9KVxufSlcblxuYXBwLnBvc3QoJy9sb2dnZWRJbicsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIFVzZXIuZmluZE9uZSh7dG9rZW46IHJlcS5ib2R5LnRva2VufSwgZnVuY3Rpb24oZXJyLCB1c2VyKSB7XG4gICAgaWYgKGVycikge3JldHVybiBuZXh0KGVycil9XG4gICAgcmVzLmpzb24oe3VzZXJ9KTtcbiAgfSlcbn0pXG5cbi8vIExvZyBvdXQgYSB1c2VyXG4vLyBOb3RlLCBSZWFjdCBSb3V0ZXIgaXMgY3VycmVudGx5IGhhbmRsaW5nIHRoaXNcbmFwcC5wb3N0KCcvbG9nb3V0JywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpe1xuICBVc2VyLmZpbmRPbmUoe3Rva2VuOiByZXEuYm9keS50b2tlbn0sIGZ1bmN0aW9uKGVyciwgdXNlcikge1xuICAgIGlmICh1c2VyKSB7XG4gICAgICB1c2VyLnRva2VuID0gbnVsbDtcbiAgICAgIHVzZXIuc2F2ZShmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgaWYgKGVycikge3JldHVybiBuZXh0KGVycil9XG4gICAgICAgIHJlcy5qc29uKHtkZWxldGVkOiB0cnVlfSk7XG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICByZXMuanNvbih7ZGVsZXRlZDogZmFsc2V9KTtcbiAgICB9XG4gIH0pXG59KTtcblxuLy8gUm9vdCBQYXRoXG5hcHAuZ2V0KCcqJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgbWF0Y2goeyByb3V0ZXMsIGxvY2F0aW9uOiByZXEudXJsIH0sIChlcnJvciwgcmVkaXJlY3RMb2NhdGlvbiwgcmVuZGVyUHJvcHMpID0+IHtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIHJlcy5zdGF0dXMoNTAwKS5zZW5kKGVycm9yLm1lc3NhZ2UpXG4gICAgfSBlbHNlIGlmIChyZWRpcmVjdExvY2F0aW9uKSB7XG4gICAgICByZXMucmVkaXJlY3QoMzAyLCByZWRpcmVjdExvY2F0aW9uLnBhdGhuYW1lICsgcmVkaXJlY3RMb2NhdGlvbi5zZWFyY2gpXG4gICAgfSBlbHNlIGlmIChyZW5kZXJQcm9wcykge1xuICAgICAgLy8gWW91IGNhbiBhbHNvIGNoZWNrIHJlbmRlclByb3BzLmNvbXBvbmVudHMgb3IgcmVuZGVyUHJvcHMucm91dGVzIGZvclxuICAgICAgLy8geW91ciBcIm5vdCBmb3VuZFwiIGNvbXBvbmVudCBvciByb3V0ZSByZXNwZWN0aXZlbHksIGFuZCBzZW5kIGEgNDA0IGFzXG4gICAgICAvLyBiZWxvdywgaWYgeW91J3JlIHVzaW5nIGEgY2F0Y2gtYWxsIHJvdXRlLlxuICAgICAgcmVzLnN0YXR1cygyMDApLnNlbmQocmVuZGVyVG9TdHJpbmcoPFJvdXRlckNvbnRleHQgey4uLnJlbmRlclByb3BzfSAvPikpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcy5zdGF0dXMoNDA0KS5zZW5kKCdOb3QgZm91bmQnKVxuICAgIH1cbiAgfSlcbn0pO1xuXG52YXIgcG9ydCA9IHByb2Nlc3MuZW52LlBPUlQgfHwgMzAwMDtcblxuYXBwLmxpc3Rlbihwb3J0KTtcbmNvbnNvbGUubG9nKCdTZXJ2ZXIgbm93IGxpc3RlbmluZyBvbiBwb3J0ICcgKyBwb3J0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBhcHA7XG4iXX0=