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
    // SD.query
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

app.get('/getstacks', function (req, res, next) {
  _user2.default.find({}, function (err, users) {
    if (err) {
      return next(err);
    }
    var stacks = {};
    var data = [];
    users.forEach(function (user) {
      user.userData.forEach(function (salary) {
        var stack = salary.stack;
        var stackArr = stack.split(', ');
        if (stackArr.length > 1) {
          stackArr.forEach(function (stack) {
            stacks[stack] ? stacks[stack]++ : stacks[stack] = 1;
          });
        } else {
          stacks[stack] ? stacks[stack]++ : stacks[stack] = 1;
        }
      });
    });

    for (var key in stacks) {
      data.push({ value: key, count: stacks[key] });
    }

    res.json({ stacks: data });
  });
});

// GET all users
app.get('/users', requireAuth, function (req, res, next) {
  _user2.default.find({}, function (err, users) {
    if (!err) {
      res.json({ users: users });
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

//# sourceMappingURL=data:application/json;base64,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QUFJLElBQUosQ0FBUyxFQUFDLFNBQVMsSUFBVixFQUFUO0FBQ0QsT0FIRDtBQUlELEtBTkQsTUFNTztBQUNMLFVBQUksSUFBSixDQUFTLEVBQUMsU0FBUyxLQUFWLEVBQVQ7QUFDRDtBQUNGLEdBVkQ7QUFXRCxDQVpEOzs7QUFlQSxJQUFJLEdBQUosQ0FBUSxHQUFSLEVBQWEsVUFBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixJQUFuQixFQUF5QjtBQUNwQywwQkFBTSxFQUFFLGNBQUYsRUFBVSxVQUFVLElBQUksR0FBeEIsRUFBTixFQUFxQyxVQUFDLEtBQUQsRUFBUSxnQkFBUixFQUEwQixXQUExQixFQUEwQztBQUM3RSxRQUFJLEtBQUosRUFBVztBQUNULFVBQUksTUFBSixDQUFXLEdBQVgsRUFBZ0IsSUFBaEIsQ0FBcUIsTUFBTSxPQUEzQjtBQUNELEtBRkQsTUFFTyxJQUFJLGdCQUFKLEVBQXNCO0FBQzNCLFVBQUksUUFBSixDQUFhLEdBQWIsRUFBa0IsaUJBQWlCLFFBQWpCLEdBQTRCLGlCQUFpQixNQUEvRDtBQUNELEtBRk0sTUFFQSxJQUFJLFdBQUosRUFBaUI7Ozs7QUFJdEIsVUFBSSxNQUFKLENBQVcsR0FBWCxFQUFnQixJQUFoQixDQUFxQiw0QkFBZSwwREFBbUIsV0FBbkIsQ0FBZixDQUFyQjtBQUNELEtBTE0sTUFLQTtBQUNMLFVBQUksTUFBSixDQUFXLEdBQVgsRUFBZ0IsSUFBaEIsQ0FBcUIsV0FBckI7QUFDRDtBQUNGLEdBYkQ7QUFjRCxDQWZEOztBQWlCQSxJQUFJLE9BQU8sUUFBUSxHQUFSLENBQVksSUFBWixJQUFvQixJQUEvQjs7QUFFQSxJQUFJLE1BQUosQ0FBVyxJQUFYO0FBQ0EsUUFBUSxHQUFSLENBQVksa0NBQWtDLElBQTlDOztBQUVBLE9BQU8sT0FBUCxHQUFpQixHQUFqQiIsImZpbGUiOiJzZXJ2ZXItYy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IGJvZHlQYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInO1xuaW1wb3J0IG1vcmdhbiBmcm9tICdtb3JnYW4nO1xuaW1wb3J0IG1vbmdvb3NlIGZyb20gJ21vbmdvb3NlJztcbmltcG9ydCBVc2VyIGZyb20gJy4vbW9kZWxzL3VzZXInO1xuaW1wb3J0IFN0YWNrRGF0YSBmcm9tICcuL21vZGVscy9zdGFja2RhdGEnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgY29ycyBmcm9tICdjb3JzJztcbmltcG9ydCBiY3J5cHQgZnJvbSAnYmNyeXB0LW5vZGVqcyc7XG5pbXBvcnQgand0IGZyb20gJ2p3dC1zaW1wbGUnO1xuaW1wb3J0IHNlY3JldCBmcm9tICcuL3NlY3JldCc7XG5pbXBvcnQgcGFzc3BvcnRBdXRoIGZyb20gJy4vcGFzc3BvcnQvcGFzc3BvcnQnO1xuaW1wb3J0IGxvY2FsQXV0aCBmcm9tICcuL3Bhc3Nwb3J0L2xvY2FsJztcbmltcG9ydCBnaXRodWIgZnJvbSAnLi9wYXNzcG9ydC9naXRodWInO1xuaW1wb3J0IHBhc3Nwb3J0IGZyb20gJ3Bhc3Nwb3J0JztcbmltcG9ydCBsb2dvdXQgZnJvbSAnZXhwcmVzcy1wYXNzcG9ydC1sb2dvdXQnO1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHJlbmRlclRvU3RyaW5nIH0gZnJvbSAncmVhY3QtZG9tL3NlcnZlcidcbmltcG9ydCB7IG1hdGNoLCBSb3V0ZXJDb250ZXh0IH0gZnJvbSAncmVhY3Qtcm91dGVyJ1xudmFyIHJvdXRlcyA9IHJlcXVpcmUoJy4vY29tcGlsZWQvc3JjL2J1bmRsZScpLmRlZmF1bHQ7XG52YXIgU0QgPSByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL3N0YWNrZGF0YUNvbnRyb2xsZXInKTtcblxudmFyIGFwcCA9IGV4cHJlc3MoKTtcblxuYXBwLnVzZShtb3JnYW4oJ2RldicpKTtcbmFwcC51c2UoYm9keVBhcnNlci51cmxlbmNvZGVkKHsgZXh0ZW5kZWQ6IHRydWUgfSkpO1xuYXBwLnVzZShib2R5UGFyc2VyLmpzb24oKSk7XG5hcHAudXNlKGV4cHJlc3Muc3RhdGljKHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9jbGllbnQvY29tcGlsZWQnKSkpO1xuXG5cbi8vIE1vbmdvb3NlIENvbm5lY3Rpb24gKFJlZmFjdG9yIGludG8gU2VwYXJhdGUgRmlsZSlcbnZhciBkYXRhYmFzZVVSTCA9IHByb2Nlc3MuZW52Lk1PTkdPREJfVVJJIHx8J21vbmdvZGI6Ly9sb2NhbGhvc3Q6MjcwMTcvc3RhY2stc2FsYXJpZXMnXG5cbm1vbmdvb3NlLmNvbm5lY3QoZGF0YWJhc2VVUkwpO1xuXG4vLyBIZWxwZXIgTWV0aG9kcyAoUmVmYWN0b3IgaW50byBTZXBhcmF0ZSBGaWxlKVxuZnVuY3Rpb24gZ2VuZXJhdGVUb2tlbih1c2VyKXtcbiAgLy8gQWRkIGlzc3VlZCBhdCB0aW1lc3RhbXAgYW5kIHN1YmplY3RcbiAgLy8gQmFzZWQgb24gdGhlIEpXVCBjb252ZW50aW9uXG4gIHZhciB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcmV0dXJuIGp3dC5lbmNvZGUoeyBzdWI6IHVzZXIuaWQsIGlhdDogdGltZXN0YW1wIH0sIHNlY3JldC5zZWNyZXQpO1xufVxuXG4vLyBTZXQgdG8gZmFsc2Ugc2luY2UgdG9rZW5zIGFyZSBiZWluZyB1c2VkXG4vLyBUaGlzIGlzIFBhc3Nwb3J0IEF1dGhlbnRpY2F0aW9uIHNldHVwXG4vLyBHaXRodWIgYXV0aCB3aWxsIGJlIGFkZGVkIGhlcmUgYXMgd2VsbFxudmFyIHJlcXVpcmVBdXRoID0gcGFzc3BvcnQuYXV0aGVudGljYXRlKCdqd3QnLCB7IHNlc3Npb246IGZhbHNlIH0gKTtcbnZhciByZXF1aXJlU2lnbkluID0gcGFzc3BvcnQuYXV0aGVudGljYXRlKCdsb2NhbCcsIHsgc2Vzc2lvbjogZmFsc2UgfSk7XG52YXIgZ2l0aHViQXV0aCA9IHBhc3Nwb3J0LmF1dGhlbnRpY2F0ZSgnZ2l0aHViJywgeyBzZXNzaW9uOiBmYWxzZSwgc3VjY2Vzc1JlZGlyZWN0OiAnLycsIGZhaWx1cmVSZWRpcmVjdDogJy9sb2dpbid9KTtcblxuLy8gQWxsb3cgYWxsIGhlYWRlcnNcbmFwcC5hbGwoJyonLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge+KAqFxuICByZXMuaGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nLCAnKicpO+KAqFxuICByZXMuaGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJywgJ1BVVCwgR0VULCBQT1NULCBERUxFVEUnKTvigKhcbiAgcmVzLmhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycycsICdDb250ZW50LVR5cGUnKTvigKhcbiAgbmV4dCgpO+KAqFxufSk7XG5cbi8vU2VhcmNoIGZvciBhbnkgZmllbGRcbmFwcC5wb3N0KCcvc2VhcmNoJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgU0QucXVlcnlTYWxhcnkocmVxLmJvZHksIGZ1bmN0aW9uKHJlc3VsdHMpIHtcbiAgICAvLyBTRC5xdWVyeVxuICAgIHJlcy5qc29uKHJlc3VsdHMpO1xuICB9KTtcbn0pO1xuXG4vLyBBZGQgYSBTdGFjayBFbnRyeVxuYXBwLnBvc3QoJy9zdGFja2VudHJ5JywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgLy8gY29uc29sZS5sb2cocmVxLmJvZHkpO1xuICBTRC5jcmVhdGVTYWxhcnkocmVxLmJvZHksIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgIHJlcy5zdGF0dXMoMjAxKTtcbiAgICByZXMuanNvbihyZXN1bHQpO1xuICB9KTtcbn0pO1xuXG5hcHAuZ2V0KCcvZ2V0c3RhY2tzJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgVXNlci5maW5kKHt9LCBmdW5jdGlvbihlcnIsIHVzZXJzKSB7XG4gICAgaWYgKGVycikgeyByZXR1cm4gbmV4dChlcnIpIH1cbiAgICB2YXIgc3RhY2tzID0ge307XG4gICAgdmFyIGRhdGEgPSBbXTtcbiAgICB1c2Vycy5mb3JFYWNoKGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgIHVzZXIudXNlckRhdGEuZm9yRWFjaChmdW5jdGlvbihzYWxhcnkpIHtcbiAgICAgICAgdmFyIHN0YWNrID0gc2FsYXJ5LnN0YWNrO1xuICAgICAgICB2YXIgc3RhY2tBcnIgPSBzdGFjay5zcGxpdCgnLCAnKTtcbiAgICAgICAgaWYgKHN0YWNrQXJyLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICBzdGFja0Fyci5mb3JFYWNoKGZ1bmN0aW9uKHN0YWNrKSB7XG4gICAgICAgICAgICBzdGFja3Nbc3RhY2tdID8gc3RhY2tzW3N0YWNrXSsrIDogc3RhY2tzW3N0YWNrXSA9IDE7XG4gICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdGFja3Nbc3RhY2tdID8gc3RhY2tzW3N0YWNrXSsrIDogc3RhY2tzW3N0YWNrXSA9IDE7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGZvciAodmFyIGtleSBpbiBzdGFja3MpIHtcbiAgICAgIGRhdGEucHVzaCh7dmFsdWU6IGtleSwgY291bnQ6IHN0YWNrc1trZXldfSk7XG4gICAgfVxuXG4gICAgcmVzLmpzb24oe3N0YWNrczogZGF0YX0pO1xuICB9KVxufSlcblxuLy8gR0VUIGFsbCB1c2Vyc1xuYXBwLmdldCgnL3VzZXJzJywgcmVxdWlyZUF1dGgsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIFVzZXIuZmluZCh7fSwgZnVuY3Rpb24oZXJyLCB1c2Vycykge1xuICAgIGlmKCFlcnIpIHtcbiAgICAgIHJlcy5qc29uKHt1c2Vyc30pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9KTtcbn0pO1xuXG4vLyBHRVQgZGF0YSBmcm9tIG9uZSB1c2VyXG4vLyBmaW5kaW5nIHVzZXIgYnkgbmFtZTpcImFhYWFhXCIsIGNoYW5nZSBhZnRlciBhZGQgdG9rZW4gdG8gZGF0YWJhc2VcbmFwcC5nZXQoJy91c2VyJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgVXNlci5maW5kKHt0b2tlbjogcmVxLnF1ZXJ5LnRva2VufSwgZnVuY3Rpb24oZXJyLCB1c2VyKSB7XG4gICAgaWYgKGVycikge2NvbnNvbGUubG9nKGVycik7fVxuICAgIHJlcy5zdGF0dXMoMjAwKS5zZW5kKHVzZXIpO1xuICB9KTtcbn0pO1xuXG5hcHAuZ2V0KCcvdXNlcnMvOmlkJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgdmFyIGlkID0gcmVxLnBhcmFtcy5pZDtcblxuICAvLyBBIGZyaWVuZGx5IGVycm9yIHRvIGRpc3BsYXkgaWYgbm8gdXNlciBtYXRjaGVzIHRoZSBpZFxuICB2YXIgZXJyID0gXCJObyBzdWNoIHVzZXIgd2l0aCB0aGUgZ2l2ZW4gaWRcIjtcblxuICAgVXNlci5maW5kT25lKHsgaWQ6IGlkfSwgZnVuY3Rpb24oZXJyLCBleGlzdGluZ1VzZXIpIHtcbiAgICBpZihlcnIpIHtcbiAgICAgIHJlcy5zZW5kKGVycik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcy5qc29uKGV4aXN0aW5nVXNlcik7XG4gICAgfVxuICAgfSk7XG59KTtcblxuLy8gVGhlIG1pZGRsZXdhcmUgd2lsbCB2ZXJpZnkgY3JlZGVudGlhbHNcbi8vIElmIHN1Y2Nlc3NmdWwsIGhhbmQgYSB0b2tlblxuYXBwLnBvc3QoJy9zaWduaW4nLCByZXF1aXJlU2lnbkluLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuXG4gIC8vIEdlbmVyYXRlIGEgdG9rZW5cbiAgdmFyIHRva2VuID0gZ2VuZXJhdGVUb2tlbihyZXEudXNlcik7XG5cbiAgLy8gU2VuZCB1c2VyIGJhY2sgYSBKV1QgdXBvbiBzdWNjZXNzZnVsIGFjY291bnQgY3JlYXRpb25cbiAgcmVzLmpzb24oe3VzZXI6IHJlcS51c2VyLCB0b2tlbjogdG9rZW59KTtcbn0pO1xuXG5hcHAucG9zdCgnL3NpZ251cCcsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIHZhciBuYW1lID0gcmVxLmJvZHkubmFtZTtcbiAgdmFyIGVtYWlsID0gcmVxLmJvZHkuZW1haWw7XG4gIHZhciBwYXNzd29yZCA9IHJlcS5ib2R5LnBhc3N3b3JkO1xuICB2YXIgZ2VuZGVyID0gcmVxLmJvZHkuZ2VuZGVyO1xuXG4gIC8vIFZhbGlkYXRpb24gdG8gY2hlY2sgaWYgYWxsIHRoZSBmaWVsZHMgd2VyZSBiZWluZyBwYXNzZWRcbiAgaWYoIWVtYWlsIHx8ICFwYXNzd29yZCB8fCAhbmFtZSl7XG4gICAgcmV0dXJuIHJlcy5zZW5kKDQyMiwge2Vycm9yOiBcIlBsZWFzZSBmaWxsIG91dCBhbGwgdGhlIGZpZWxkc1wifSk7XG4gIH1cblxuICAvLyBDaGVjayBlbWFpbCBhbHJlYWR5IGV4aXN0c1xuICBVc2VyLmZpbmRPbmUoeyBlbWFpbDogZW1haWx9LCBmdW5jdGlvbihlcnIsIGV4aXN0aW5nVXNlcikge1xuXG4gICAgaWYoZXJyKSB7IHJldHVybiBuZXh0KGVycik7IH1cblxuICAgIC8vIElmIGl0IGRvZXMsIHJldHVybiBcImV4aXN0aW5nIGFjY291bnRcIiBtZXNzYWdlXG4gICAgaWYoZXhpc3RpbmdVc2VyKXtcbiAgICAgIC8vIFJldHVybiB1bnByb2Nlc3NhYmxlIGVudGl0eVxuICAgICAgcmV0dXJuIHJlcy5zZW5kKDQyMiwgeyBlcnJvcjogJ0VtYWlsIGlzIGluIHVzZScgfSk7XG4gICAgfVxuXG4gICAgLy8gSWYgbm90LCBjcmVhdGUgYW5kIHNhdmUgdXNlclxuICAgIHZhciB1c2VyID0gbmV3IFVzZXIoe1xuICAgICAgbmFtZTogbmFtZSxcbiAgICAgIGVtYWlsOiBlbWFpbCxcbiAgICAgIHBhc3N3b3JkOiBwYXNzd29yZCxcbiAgICAgIGdlbmRlcjogZ2VuZGVyLFxuICAgICAgdG9rZW46IG51bGwsXG4gICAgICBmaXJzdFNhdmU6IHRydWVcbiAgICB9KTtcblxuICAgIHVzZXIuc2F2ZShmdW5jdGlvbihlcnIpe1xuICAgICAgaWYgKGVycikgeyByZXR1cm4gbmV4dChlcnIpOyB9XG5cbiAgICAgIC8vIEdlbmVyYXRlIGEgdG9rZW5cbiAgICAgIHZhciB0b2tlbiA9IGdlbmVyYXRlVG9rZW4odXNlcik7XG5cbiAgICAgIC8vIFNlbmQgdXNlciBiYWNrIGEgSldUIHVwb24gc3VjY2Vzc2Z1bCBhY2NvdW50IGNyZWF0aW9uXG4gICAgICByZXMuanNvbih7dXNlcjogdXNlciwgdG9rZW46IHRva2VufSk7XG4gICAgfSk7XG5cbiAgfSk7XG5cbn0pO1xuXG5hcHAucG9zdCgnL3NhdmV0b2tlbicsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIFVzZXIuZmluZE9uZSh7ZW1haWw6IHJlcS5ib2R5LmVtYWlsfSwgZnVuY3Rpb24oZXJyLCB1c2VyKSB7XG4gICAgaWYgKGVycikgeyByZXR1cm4gbmV4dChlcnIpIH1cbiAgICBjb25zb2xlLmxvZygnU0FWRSBUT0tFTicsIHJlcS5ib2R5LnRva2VuKTtcbiAgICB1c2VyLnRva2VuID0gcmVxLmJvZHkudG9rZW47XG4gICAgdXNlci5zYXZlKGZ1bmN0aW9uKGVycikge1xuICAgICAgaWYgKGVycikgeyByZXR1cm4gbmV4dChlcnIpIH1cbiAgICAgIHJlcy5qc29uKHt1c2VyfSk7XG4gICAgfSlcbiAgfSlcbn0pXG5cbmFwcC5wb3N0KCcvbG9nZ2VkSW4nLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICBVc2VyLmZpbmRPbmUoe3Rva2VuOiByZXEuYm9keS50b2tlbn0sIGZ1bmN0aW9uKGVyciwgdXNlcikge1xuICAgIGlmIChlcnIpIHtyZXR1cm4gbmV4dChlcnIpfVxuICAgIHJlcy5qc29uKHt1c2VyfSk7XG4gIH0pXG59KVxuXG4vLyBMb2cgb3V0IGEgdXNlclxuLy8gTm90ZSwgUmVhY3QgUm91dGVyIGlzIGN1cnJlbnRseSBoYW5kbGluZyB0aGlzXG5hcHAucG9zdCgnL2xvZ291dCcsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KXtcbiAgVXNlci5maW5kT25lKHt0b2tlbjogcmVxLmJvZHkudG9rZW59LCBmdW5jdGlvbihlcnIsIHVzZXIpIHtcbiAgICBpZiAodXNlcikge1xuICAgICAgdXNlci50b2tlbiA9IG51bGw7XG4gICAgICB1c2VyLnNhdmUoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGlmIChlcnIpIHtyZXR1cm4gbmV4dChlcnIpfVxuICAgICAgICByZXMuanNvbih7ZGVsZXRlZDogdHJ1ZX0pO1xuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzLmpzb24oe2RlbGV0ZWQ6IGZhbHNlfSk7XG4gICAgfVxuICB9KVxufSk7XG5cbi8vIFJvb3QgUGF0aFxuYXBwLmdldCgnKicsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIG1hdGNoKHsgcm91dGVzLCBsb2NhdGlvbjogcmVxLnVybCB9LCAoZXJyb3IsIHJlZGlyZWN0TG9jYXRpb24sIHJlbmRlclByb3BzKSA9PiB7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICByZXMuc3RhdHVzKDUwMCkuc2VuZChlcnJvci5tZXNzYWdlKVxuICAgIH0gZWxzZSBpZiAocmVkaXJlY3RMb2NhdGlvbikge1xuICAgICAgcmVzLnJlZGlyZWN0KDMwMiwgcmVkaXJlY3RMb2NhdGlvbi5wYXRobmFtZSArIHJlZGlyZWN0TG9jYXRpb24uc2VhcmNoKVxuICAgIH0gZWxzZSBpZiAocmVuZGVyUHJvcHMpIHtcbiAgICAgIC8vIFlvdSBjYW4gYWxzbyBjaGVjayByZW5kZXJQcm9wcy5jb21wb25lbnRzIG9yIHJlbmRlclByb3BzLnJvdXRlcyBmb3JcbiAgICAgIC8vIHlvdXIgXCJub3QgZm91bmRcIiBjb21wb25lbnQgb3Igcm91dGUgcmVzcGVjdGl2ZWx5LCBhbmQgc2VuZCBhIDQwNCBhc1xuICAgICAgLy8gYmVsb3csIGlmIHlvdSdyZSB1c2luZyBhIGNhdGNoLWFsbCByb3V0ZS5cbiAgICAgIHJlcy5zdGF0dXMoMjAwKS5zZW5kKHJlbmRlclRvU3RyaW5nKDxSb3V0ZXJDb250ZXh0IHsuLi5yZW5kZXJQcm9wc30gLz4pKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXMuc3RhdHVzKDQwNCkuc2VuZCgnTm90IGZvdW5kJylcbiAgICB9XG4gIH0pXG59KTtcblxudmFyIHBvcnQgPSBwcm9jZXNzLmVudi5QT1JUIHx8IDMwMDA7XG5cbmFwcC5saXN0ZW4ocG9ydCk7XG5jb25zb2xlLmxvZygnU2VydmVyIG5vdyBsaXN0ZW5pbmcgb24gcG9ydCAnICsgcG9ydCk7XG5cbm1vZHVsZS5leHBvcnRzID0gYXBwO1xuIl19