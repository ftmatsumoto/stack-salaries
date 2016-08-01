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
        stacks[stack] ? stacks[stack]++ : stacks[stack] = 1;
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

//# sourceMappingURL=data:application/json;base64,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RUFBVSxVQUFVLElBQUksR0FBeEIsRUFBTixFQUFxQyxVQUFDLEtBQUQsRUFBUSxnQkFBUixFQUEwQixXQUExQixFQUEwQztBQUM3RSxRQUFJLEtBQUosRUFBVztBQUNULFVBQUksTUFBSixDQUFXLEdBQVgsRUFBZ0IsSUFBaEIsQ0FBcUIsTUFBTSxPQUEzQjtBQUNELEtBRkQsTUFFTyxJQUFJLGdCQUFKLEVBQXNCO0FBQzNCLFVBQUksUUFBSixDQUFhLEdBQWIsRUFBa0IsaUJBQWlCLFFBQWpCLEdBQTRCLGlCQUFpQixNQUEvRDtBQUNELEtBRk0sTUFFQSxJQUFJLFdBQUosRUFBaUI7Ozs7QUFJdEIsVUFBSSxNQUFKLENBQVcsR0FBWCxFQUFnQixJQUFoQixDQUFxQiw0QkFBZSwwREFBbUIsV0FBbkIsQ0FBZixDQUFyQjtBQUNELEtBTE0sTUFLQTtBQUNMLFVBQUksTUFBSixDQUFXLEdBQVgsRUFBZ0IsSUFBaEIsQ0FBcUIsV0FBckI7QUFDRDtBQUNGLEdBYkQ7QUFjRCxDQWZEOztBQWlCQSxJQUFJLE9BQU8sUUFBUSxHQUFSLENBQVksSUFBWixJQUFvQixJQUEvQjs7QUFFQSxJQUFJLE1BQUosQ0FBVyxJQUFYO0FBQ0EsUUFBUSxHQUFSLENBQVksa0NBQWtDLElBQTlDOztBQUVBLE9BQU8sT0FBUCxHQUFpQixHQUFqQiIsImZpbGUiOiJzZXJ2ZXItYy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IGJvZHlQYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInO1xuaW1wb3J0IG1vcmdhbiBmcm9tICdtb3JnYW4nO1xuaW1wb3J0IG1vbmdvb3NlIGZyb20gJ21vbmdvb3NlJztcbmltcG9ydCBVc2VyIGZyb20gJy4vbW9kZWxzL3VzZXInO1xuaW1wb3J0IFN0YWNrRGF0YSBmcm9tICcuL21vZGVscy9zdGFja2RhdGEnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgY29ycyBmcm9tICdjb3JzJztcbmltcG9ydCBiY3J5cHQgZnJvbSAnYmNyeXB0LW5vZGVqcyc7XG5pbXBvcnQgand0IGZyb20gJ2p3dC1zaW1wbGUnO1xuaW1wb3J0IHNlY3JldCBmcm9tICcuL3NlY3JldCc7XG5pbXBvcnQgcGFzc3BvcnRBdXRoIGZyb20gJy4vcGFzc3BvcnQvcGFzc3BvcnQnO1xuaW1wb3J0IGxvY2FsQXV0aCBmcm9tICcuL3Bhc3Nwb3J0L2xvY2FsJztcbmltcG9ydCBnaXRodWIgZnJvbSAnLi9wYXNzcG9ydC9naXRodWInO1xuaW1wb3J0IHBhc3Nwb3J0IGZyb20gJ3Bhc3Nwb3J0JztcbmltcG9ydCBsb2dvdXQgZnJvbSAnZXhwcmVzcy1wYXNzcG9ydC1sb2dvdXQnO1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHJlbmRlclRvU3RyaW5nIH0gZnJvbSAncmVhY3QtZG9tL3NlcnZlcidcbmltcG9ydCB7IG1hdGNoLCBSb3V0ZXJDb250ZXh0IH0gZnJvbSAncmVhY3Qtcm91dGVyJ1xudmFyIHJvdXRlcyA9IHJlcXVpcmUoJy4vY29tcGlsZWQvc3JjL2J1bmRsZScpLmRlZmF1bHQ7XG52YXIgU0QgPSByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL3N0YWNrZGF0YUNvbnRyb2xsZXInKTtcblxudmFyIGFwcCA9IGV4cHJlc3MoKTtcblxuYXBwLnVzZShtb3JnYW4oJ2RldicpKTtcbmFwcC51c2UoYm9keVBhcnNlci51cmxlbmNvZGVkKHsgZXh0ZW5kZWQ6IHRydWUgfSkpO1xuYXBwLnVzZShib2R5UGFyc2VyLmpzb24oKSk7XG5hcHAudXNlKGV4cHJlc3Muc3RhdGljKHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9jbGllbnQvY29tcGlsZWQnKSkpO1xuXG5cbi8vIE1vbmdvb3NlIENvbm5lY3Rpb24gKFJlZmFjdG9yIGludG8gU2VwYXJhdGUgRmlsZSlcbnZhciBkYXRhYmFzZVVSTCA9IHByb2Nlc3MuZW52Lk1PTkdPREJfVVJJIHx8J21vbmdvZGI6Ly9sb2NhbGhvc3Q6MjcwMTcvc3RhY2stc2FsYXJpZXMnXG5cbm1vbmdvb3NlLmNvbm5lY3QoZGF0YWJhc2VVUkwpO1xuXG4vLyBIZWxwZXIgTWV0aG9kcyAoUmVmYWN0b3IgaW50byBTZXBhcmF0ZSBGaWxlKVxuZnVuY3Rpb24gZ2VuZXJhdGVUb2tlbih1c2VyKXtcbiAgLy8gQWRkIGlzc3VlZCBhdCB0aW1lc3RhbXAgYW5kIHN1YmplY3RcbiAgLy8gQmFzZWQgb24gdGhlIEpXVCBjb252ZW50aW9uXG4gIHZhciB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcmV0dXJuIGp3dC5lbmNvZGUoeyBzdWI6IHVzZXIuaWQsIGlhdDogdGltZXN0YW1wIH0sIHNlY3JldC5zZWNyZXQpO1xufVxuXG4vLyBTZXQgdG8gZmFsc2Ugc2luY2UgdG9rZW5zIGFyZSBiZWluZyB1c2VkXG4vLyBUaGlzIGlzIFBhc3Nwb3J0IEF1dGhlbnRpY2F0aW9uIHNldHVwXG4vLyBHaXRodWIgYXV0aCB3aWxsIGJlIGFkZGVkIGhlcmUgYXMgd2VsbFxudmFyIHJlcXVpcmVBdXRoID0gcGFzc3BvcnQuYXV0aGVudGljYXRlKCdqd3QnLCB7IHNlc3Npb246IGZhbHNlIH0gKTtcbnZhciByZXF1aXJlU2lnbkluID0gcGFzc3BvcnQuYXV0aGVudGljYXRlKCdsb2NhbCcsIHsgc2Vzc2lvbjogZmFsc2UgfSk7XG52YXIgZ2l0aHViQXV0aCA9IHBhc3Nwb3J0LmF1dGhlbnRpY2F0ZSgnZ2l0aHViJywgeyBzZXNzaW9uOiBmYWxzZSwgc3VjY2Vzc1JlZGlyZWN0OiAnLycsIGZhaWx1cmVSZWRpcmVjdDogJy9sb2dpbid9KTtcblxuLy8gQWxsb3cgYWxsIGhlYWRlcnNcbmFwcC5hbGwoJyonLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge+KAqFxuICByZXMuaGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nLCAnKicpO+KAqFxuICByZXMuaGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJywgJ1BVVCwgR0VULCBQT1NULCBERUxFVEUnKTvigKhcbiAgcmVzLmhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycycsICdDb250ZW50LVR5cGUnKTvigKhcbiAgbmV4dCgpO+KAqFxufSk7XG5cbi8vU2VhcmNoIGZvciBhbnkgZmllbGRcbmFwcC5wb3N0KCcvc2VhcmNoJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgU0QucXVlcnlTYWxhcnkocmVxLmJvZHksIGZ1bmN0aW9uKHJlc3VsdHMpIHtcbiAgICByZXMuanNvbihyZXN1bHRzKTtcbiAgfSk7XG59KTtcblxuLy8gQWRkIGEgU3RhY2sgRW50cnlcbmFwcC5wb3N0KCcvc3RhY2tlbnRyeScsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIC8vIGNvbnNvbGUubG9nKHJlcS5ib2R5KTtcbiAgU0QuY3JlYXRlU2FsYXJ5KHJlcS5ib2R5LCBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICByZXMuc3RhdHVzKDIwMSk7XG4gICAgcmVzLmpzb24ocmVzdWx0KTtcbiAgfSk7XG59KTtcblxuYXBwLmdldCgnL2dldHN0YWNrcycsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIFVzZXIuZmluZCh7fSwgZnVuY3Rpb24oZXJyLCB1c2Vycykge1xuICAgIGlmIChlcnIpIHsgcmV0dXJuIG5leHQoZXJyKSB9XG4gICAgdmFyIHN0YWNrcyA9IHt9O1xuICAgIHZhciBkYXRhID0gW107XG4gICAgdXNlcnMuZm9yRWFjaChmdW5jdGlvbih1c2VyKSB7XG4gICAgICB1c2VyLnVzZXJEYXRhLmZvckVhY2goZnVuY3Rpb24oc2FsYXJ5KSB7XG4gICAgICAgIHZhciBzdGFjayA9IHNhbGFyeS5zdGFjaztcbiAgICAgICAgc3RhY2tzW3N0YWNrXSA/IHN0YWNrc1tzdGFja10rKyA6IHN0YWNrc1tzdGFja10gPSAxO1xuICAgICAgfSlcbiAgICB9KVxuXG4gICAgZm9yICh2YXIga2V5IGluIHN0YWNrcykge1xuICAgICAgZGF0YS5wdXNoKHt2YWx1ZToga2V5LCBjb3VudDogc3RhY2tzW2tleV19KTtcbiAgICB9XG5cbiAgICByZXMuanNvbih7c3RhY2tzOiBkYXRhfSk7XG4gIH0pXG59KVxuXG4vLyBHRVQgYWxsIHVzZXJzXG5hcHAuZ2V0KCcvdXNlcnMnLCByZXF1aXJlQXV0aCwgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgVXNlci5maW5kKHt9LCBmdW5jdGlvbihlcnIsIHVzZXJzKSB7XG4gICAgaWYoIWVycikge1xuICAgICAgcmVzLmpzb24oe3VzZXJzfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH0pO1xufSk7XG5cbi8vIEdFVCBkYXRhIGZyb20gb25lIHVzZXJcbi8vIGZpbmRpbmcgdXNlciBieSBuYW1lOlwiYWFhYWFcIiwgY2hhbmdlIGFmdGVyIGFkZCB0b2tlbiB0byBkYXRhYmFzZVxuYXBwLmdldCgnL3VzZXInLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICBVc2VyLmZpbmQoe3Rva2VuOiByZXEucXVlcnkudG9rZW59LCBmdW5jdGlvbihlcnIsIHVzZXIpIHtcbiAgICBpZiAoZXJyKSB7Y29uc29sZS5sb2coZXJyKTt9XG4gICAgcmVzLnN0YXR1cygyMDApLnNlbmQodXNlcik7XG4gIH0pO1xufSk7XG5cbmFwcC5nZXQoJy91c2Vycy86aWQnLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICB2YXIgaWQgPSByZXEucGFyYW1zLmlkO1xuXG4gIC8vIEEgZnJpZW5kbHkgZXJyb3IgdG8gZGlzcGxheSBpZiBubyB1c2VyIG1hdGNoZXMgdGhlIGlkXG4gIHZhciBlcnIgPSBcIk5vIHN1Y2ggdXNlciB3aXRoIHRoZSBnaXZlbiBpZFwiO1xuXG4gICBVc2VyLmZpbmRPbmUoeyBpZDogaWR9LCBmdW5jdGlvbihlcnIsIGV4aXN0aW5nVXNlcikge1xuICAgIGlmKGVycikge1xuICAgICAgcmVzLnNlbmQoZXJyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzLmpzb24oZXhpc3RpbmdVc2VyKTtcbiAgICB9XG4gICB9KTtcbn0pO1xuXG4vLyBUaGUgbWlkZGxld2FyZSB3aWxsIHZlcmlmeSBjcmVkZW50aWFsc1xuLy8gSWYgc3VjY2Vzc2Z1bCwgaGFuZCBhIHRva2VuXG5hcHAucG9zdCgnL3NpZ25pbicsIHJlcXVpcmVTaWduSW4sIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG5cbiAgLy8gR2VuZXJhdGUgYSB0b2tlblxuICB2YXIgdG9rZW4gPSBnZW5lcmF0ZVRva2VuKHJlcS51c2VyKTtcblxuICAvLyBTZW5kIHVzZXIgYmFjayBhIEpXVCB1cG9uIHN1Y2Nlc3NmdWwgYWNjb3VudCBjcmVhdGlvblxuICByZXMuanNvbih7dXNlcjogcmVxLnVzZXIsIHRva2VuOiB0b2tlbn0pO1xufSk7XG5cbmFwcC5wb3N0KCcvc2lnbnVwJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgdmFyIG5hbWUgPSByZXEuYm9keS5uYW1lO1xuICB2YXIgZW1haWwgPSByZXEuYm9keS5lbWFpbDtcbiAgdmFyIHBhc3N3b3JkID0gcmVxLmJvZHkucGFzc3dvcmQ7XG4gIHZhciBnZW5kZXIgPSByZXEuYm9keS5nZW5kZXI7XG5cbiAgLy8gVmFsaWRhdGlvbiB0byBjaGVjayBpZiBhbGwgdGhlIGZpZWxkcyB3ZXJlIGJlaW5nIHBhc3NlZFxuICBpZighZW1haWwgfHwgIXBhc3N3b3JkIHx8ICFuYW1lKXtcbiAgICByZXR1cm4gcmVzLnNlbmQoNDIyLCB7ZXJyb3I6IFwiUGxlYXNlIGZpbGwgb3V0IGFsbCB0aGUgZmllbGRzXCJ9KTtcbiAgfVxuXG4gIC8vIENoZWNrIGVtYWlsIGFscmVhZHkgZXhpc3RzXG4gIFVzZXIuZmluZE9uZSh7IGVtYWlsOiBlbWFpbH0sIGZ1bmN0aW9uKGVyciwgZXhpc3RpbmdVc2VyKSB7XG5cbiAgICBpZihlcnIpIHsgcmV0dXJuIG5leHQoZXJyKTsgfVxuXG4gICAgLy8gSWYgaXQgZG9lcywgcmV0dXJuIFwiZXhpc3RpbmcgYWNjb3VudFwiIG1lc3NhZ2VcbiAgICBpZihleGlzdGluZ1VzZXIpe1xuICAgICAgLy8gUmV0dXJuIHVucHJvY2Vzc2FibGUgZW50aXR5XG4gICAgICByZXR1cm4gcmVzLnNlbmQoNDIyLCB7IGVycm9yOiAnRW1haWwgaXMgaW4gdXNlJyB9KTtcbiAgICB9XG5cbiAgICAvLyBJZiBub3QsIGNyZWF0ZSBhbmQgc2F2ZSB1c2VyXG4gICAgdmFyIHVzZXIgPSBuZXcgVXNlcih7XG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgZW1haWw6IGVtYWlsLFxuICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxuICAgICAgZ2VuZGVyOiBnZW5kZXIsXG4gICAgICB0b2tlbjogbnVsbCxcbiAgICAgIGZpcnN0U2F2ZTogdHJ1ZVxuICAgIH0pO1xuXG4gICAgdXNlci5zYXZlKGZ1bmN0aW9uKGVycil7XG4gICAgICBpZiAoZXJyKSB7IHJldHVybiBuZXh0KGVycik7IH1cblxuICAgICAgLy8gR2VuZXJhdGUgYSB0b2tlblxuICAgICAgdmFyIHRva2VuID0gZ2VuZXJhdGVUb2tlbih1c2VyKTtcblxuICAgICAgLy8gU2VuZCB1c2VyIGJhY2sgYSBKV1QgdXBvbiBzdWNjZXNzZnVsIGFjY291bnQgY3JlYXRpb25cbiAgICAgIHJlcy5qc29uKHt1c2VyOiB1c2VyLCB0b2tlbjogdG9rZW59KTtcbiAgICB9KTtcblxuICB9KTtcblxufSk7XG5cbmFwcC5wb3N0KCcvc2F2ZXRva2VuJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgVXNlci5maW5kT25lKHtlbWFpbDogcmVxLmJvZHkuZW1haWx9LCBmdW5jdGlvbihlcnIsIHVzZXIpIHtcbiAgICBpZiAoZXJyKSB7IHJldHVybiBuZXh0KGVycikgfVxuICAgIGNvbnNvbGUubG9nKCdTQVZFIFRPS0VOJywgcmVxLmJvZHkudG9rZW4pO1xuICAgIHVzZXIudG9rZW4gPSByZXEuYm9keS50b2tlbjtcbiAgICB1c2VyLnNhdmUoZnVuY3Rpb24oZXJyKSB7XG4gICAgICBpZiAoZXJyKSB7IHJldHVybiBuZXh0KGVycikgfVxuICAgICAgcmVzLmpzb24oe3VzZXJ9KTtcbiAgICB9KVxuICB9KVxufSlcblxuYXBwLnBvc3QoJy9sb2dnZWRJbicsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIFVzZXIuZmluZE9uZSh7dG9rZW46IHJlcS5ib2R5LnRva2VufSwgZnVuY3Rpb24oZXJyLCB1c2VyKSB7XG4gICAgaWYgKGVycikge3JldHVybiBuZXh0KGVycil9XG4gICAgcmVzLmpzb24oe3VzZXJ9KTtcbiAgfSlcbn0pXG5cbi8vIExvZyBvdXQgYSB1c2VyXG4vLyBOb3RlLCBSZWFjdCBSb3V0ZXIgaXMgY3VycmVudGx5IGhhbmRsaW5nIHRoaXNcbmFwcC5wb3N0KCcvbG9nb3V0JywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpe1xuICBVc2VyLmZpbmRPbmUoe3Rva2VuOiByZXEuYm9keS50b2tlbn0sIGZ1bmN0aW9uKGVyciwgdXNlcikge1xuICAgIGlmICh1c2VyKSB7XG4gICAgICB1c2VyLnRva2VuID0gbnVsbDtcbiAgICAgIHVzZXIuc2F2ZShmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgaWYgKGVycikge3JldHVybiBuZXh0KGVycil9XG4gICAgICAgIHJlcy5qc29uKHtkZWxldGVkOiB0cnVlfSk7XG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICByZXMuanNvbih7ZGVsZXRlZDogZmFsc2V9KTtcbiAgICB9XG4gIH0pXG59KTtcblxuLy8gUm9vdCBQYXRoXG5hcHAuZ2V0KCcqJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgbWF0Y2goeyByb3V0ZXMsIGxvY2F0aW9uOiByZXEudXJsIH0sIChlcnJvciwgcmVkaXJlY3RMb2NhdGlvbiwgcmVuZGVyUHJvcHMpID0+IHtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIHJlcy5zdGF0dXMoNTAwKS5zZW5kKGVycm9yLm1lc3NhZ2UpXG4gICAgfSBlbHNlIGlmIChyZWRpcmVjdExvY2F0aW9uKSB7XG4gICAgICByZXMucmVkaXJlY3QoMzAyLCByZWRpcmVjdExvY2F0aW9uLnBhdGhuYW1lICsgcmVkaXJlY3RMb2NhdGlvbi5zZWFyY2gpXG4gICAgfSBlbHNlIGlmIChyZW5kZXJQcm9wcykge1xuICAgICAgLy8gWW91IGNhbiBhbHNvIGNoZWNrIHJlbmRlclByb3BzLmNvbXBvbmVudHMgb3IgcmVuZGVyUHJvcHMucm91dGVzIGZvclxuICAgICAgLy8geW91ciBcIm5vdCBmb3VuZFwiIGNvbXBvbmVudCBvciByb3V0ZSByZXNwZWN0aXZlbHksIGFuZCBzZW5kIGEgNDA0IGFzXG4gICAgICAvLyBiZWxvdywgaWYgeW91J3JlIHVzaW5nIGEgY2F0Y2gtYWxsIHJvdXRlLlxuICAgICAgcmVzLnN0YXR1cygyMDApLnNlbmQocmVuZGVyVG9TdHJpbmcoPFJvdXRlckNvbnRleHQgey4uLnJlbmRlclByb3BzfSAvPikpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcy5zdGF0dXMoNDA0KS5zZW5kKCdOb3QgZm91bmQnKVxuICAgIH1cbiAgfSlcbn0pO1xuXG52YXIgcG9ydCA9IHByb2Nlc3MuZW52LlBPUlQgfHwgMzAwMDtcblxuYXBwLmxpc3Rlbihwb3J0KTtcbmNvbnNvbGUubG9nKCdTZXJ2ZXIgbm93IGxpc3RlbmluZyBvbiBwb3J0ICcgKyBwb3J0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBhcHA7XG4iXX0=
