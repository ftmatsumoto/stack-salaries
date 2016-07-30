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

//# sourceMappingURL=data:application/json;base64,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RCxFQUFRLGdCQUFSLEVBQTBCLFdBQTFCLEVBQTBDO0FBQzdFLFFBQUksS0FBSixFQUFXO0FBQ1QsVUFBSSxNQUFKLENBQVcsR0FBWCxFQUFnQixJQUFoQixDQUFxQixNQUFNLE9BQTNCO0FBQ0QsS0FGRCxNQUVPLElBQUksZ0JBQUosRUFBc0I7QUFDM0IsVUFBSSxRQUFKLENBQWEsR0FBYixFQUFrQixpQkFBaUIsUUFBakIsR0FBNEIsaUJBQWlCLE1BQS9EO0FBQ0QsS0FGTSxNQUVBLElBQUksV0FBSixFQUFpQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQSxVQUFJLE1BQUosQ0FBVyxHQUFYLEVBQWdCLElBQWhCLENBQXFCLDRCQUFlLDBEQUFtQixXQUFuQixDQUFmLENBQXJCO0FBQ0QsS0FMTSxNQUtBO0FBQ0wsVUFBSSxNQUFKLENBQVcsR0FBWCxFQUFnQixJQUFoQixDQUFxQixXQUFyQjtBQUNEO0FBQ0YsR0FiRDtBQWNELENBZkQ7O0FBaUJBLElBQUksT0FBTyxRQUFRLEdBQVIsQ0FBWSxJQUFaLElBQW9CLElBQS9COztBQUVBLElBQUksTUFBSixDQUFXLElBQVg7QUFDQSxRQUFRLEdBQVIsQ0FBWSxrQ0FBa0MsSUFBOUM7O0FBRUEsT0FBTyxPQUFQLEdBQWlCLEdBQWpCIiwiZmlsZSI6InNlcnZlci1jLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgYm9keVBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgbW9yZ2FuIGZyb20gJ21vcmdhbic7XG5pbXBvcnQgbW9uZ29vc2UgZnJvbSAnbW9uZ29vc2UnO1xuaW1wb3J0IFVzZXIgZnJvbSAnLi9tb2RlbHMvdXNlcic7XG5pbXBvcnQgU3RhY2tEYXRhIGZyb20gJy4vbW9kZWxzL3N0YWNrZGF0YSc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBjb3JzIGZyb20gJ2NvcnMnO1xuaW1wb3J0IGJjcnlwdCBmcm9tICdiY3J5cHQtbm9kZWpzJztcbmltcG9ydCBqd3QgZnJvbSAnand0LXNpbXBsZSc7XG5pbXBvcnQgc2VjcmV0IGZyb20gJy4vc2VjcmV0JztcbmltcG9ydCBwYXNzcG9ydEF1dGggZnJvbSAnLi9wYXNzcG9ydC9wYXNzcG9ydCc7XG5pbXBvcnQgbG9jYWxBdXRoIGZyb20gJy4vcGFzc3BvcnQvbG9jYWwnO1xuaW1wb3J0IGdpdGh1YiBmcm9tICcuL3Bhc3Nwb3J0L2dpdGh1Yic7XG5pbXBvcnQgcGFzc3BvcnQgZnJvbSAncGFzc3BvcnQnO1xuaW1wb3J0IGxvZ291dCBmcm9tICdleHByZXNzLXBhc3Nwb3J0LWxvZ291dCc7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgcmVuZGVyVG9TdHJpbmcgfSBmcm9tICdyZWFjdC1kb20vc2VydmVyJ1xuaW1wb3J0IHsgbWF0Y2gsIFJvdXRlckNvbnRleHQgfSBmcm9tICdyZWFjdC1yb3V0ZXInXG52YXIgcm91dGVzID0gcmVxdWlyZSgnLi9jb21waWxlZC9zcmMvYnVuZGxlJykuZGVmYXVsdDtcbnZhciBTRCA9IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvc3RhY2tkYXRhQ29udHJvbGxlcicpO1xuXG52YXIgYXBwID0gZXhwcmVzcygpO1xuXG5hcHAudXNlKG1vcmdhbignZGV2JykpO1xuYXBwLnVzZShib2R5UGFyc2VyLnVybGVuY29kZWQoeyBleHRlbmRlZDogdHJ1ZSB9KSk7XG5hcHAudXNlKGJvZHlQYXJzZXIuanNvbigpKTtcbmFwcC51c2UoZXhwcmVzcy5zdGF0aWMocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL2NsaWVudC9jb21waWxlZCcpKSk7XG5cblxuLy8gTW9uZ29vc2UgQ29ubmVjdGlvbiAoUmVmYWN0b3IgaW50byBTZXBhcmF0ZSBGaWxlKVxudmFyIGRhdGFiYXNlVVJMID0gcHJvY2Vzcy5lbnYuTU9OR09MQUJTIHx8J21vbmdvZGI6Ly9sb2NhbGhvc3Q6MjcwMTcvc3RhY2stc2FsYXJpZXMnXG5cbm1vbmdvb3NlLmNvbm5lY3QoZGF0YWJhc2VVUkwpO1xuXG4vLyBIZWxwZXIgTWV0aG9kcyAoUmVmYWN0b3IgaW50byBTZXBhcmF0ZSBGaWxlKVxuZnVuY3Rpb24gZ2VuZXJhdGVUb2tlbih1c2VyKXtcbiAgLy8gQWRkIGlzc3VlZCBhdCB0aW1lc3RhbXAgYW5kIHN1YmplY3RcbiAgLy8gQmFzZWQgb24gdGhlIEpXVCBjb252ZW50aW9uXG4gIHZhciB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcmV0dXJuIGp3dC5lbmNvZGUoeyBzdWI6IHVzZXIuaWQsIGlhdDogdGltZXN0YW1wIH0sIHNlY3JldC5zZWNyZXQpO1xufVxuXG4vLyBTZXQgdG8gZmFsc2Ugc2luY2UgdG9rZW5zIGFyZSBiZWluZyB1c2VkXG4vLyBUaGlzIGlzIFBhc3Nwb3J0IEF1dGhlbnRpY2F0aW9uIHNldHVwXG4vLyBHaXRodWIgYXV0aCB3aWxsIGJlIGFkZGVkIGhlcmUgYXMgd2VsbFxudmFyIHJlcXVpcmVBdXRoID0gcGFzc3BvcnQuYXV0aGVudGljYXRlKCdqd3QnLCB7IHNlc3Npb246IGZhbHNlIH0gKTtcbnZhciByZXF1aXJlU2lnbkluID0gcGFzc3BvcnQuYXV0aGVudGljYXRlKCdsb2NhbCcsIHsgc2Vzc2lvbjogZmFsc2UgfSk7XG52YXIgZ2l0aHViQXV0aCA9IHBhc3Nwb3J0LmF1dGhlbnRpY2F0ZSgnZ2l0aHViJywgeyBzZXNzaW9uOiBmYWxzZSwgc3VjY2Vzc1JlZGlyZWN0OiAnLycsIGZhaWx1cmVSZWRpcmVjdDogJy9sb2dpbid9KTtcblxuLy8gQWxsb3cgYWxsIGhlYWRlcnNcbmFwcC5hbGwoJyonLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge+KAqFxuICByZXMuaGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nLCAnKicpO+KAqFxuICByZXMuaGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJywgJ1BVVCwgR0VULCBQT1NULCBERUxFVEUnKTvigKhcbiAgcmVzLmhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycycsICdDb250ZW50LVR5cGUnKTvigKhcbiAgbmV4dCgpO+KAqFxufSk7XG5cbi8vU2VhcmNoIGZvciBhbnkgZmllbGRcbmFwcC5wb3N0KCcvc2VhcmNoJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgU0QucXVlcnlTYWxhcnkocmVxLmJvZHksIGZ1bmN0aW9uKHJlc3VsdHMpIHtcbiAgICByZXMuanNvbihyZXN1bHRzKTtcbiAgfSk7XG59KTtcblxuLy8gQWRkIGEgU3RhY2sgRW50cnlcbmFwcC5wb3N0KCcvc3RhY2tlbnRyeScsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIFNELmNyZWF0ZVNhbGFyeShyZXEuYm9keSwgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgcmVzLnN0YXR1cygyMDEpO1xuICAgIHJlcy5qc29uKHJlc3VsdCk7XG4gIH0pO1xufSk7XG5cbi8vIEdFVCBhbGwgdXNlcnNcbmFwcC5nZXQoJy91c2VycycsIHJlcXVpcmVBdXRoLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICBVc2VyLmZpbmQoe30sIGZ1bmN0aW9uKGVyciwgdXNlcnMpIHtcbiAgICBpZighZXJyKSB7XG4gICAgICByZXMuc2VuZCgyMDAsIHVzZXJzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfSk7XG59KTtcblxuYXBwLmdldCgnL3VzZXJzLzppZCcsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIHZhciBpZCA9IHJlcS5wYXJhbXMuaWQ7XG5cbiAgLy8gQSBmcmllbmRseSBlcnJvciB0byBkaXNwbGF5IGlmIG5vIHVzZXIgbWF0Y2hlcyB0aGUgaWRcbiAgdmFyIGVyciA9IFwiTm8gc3VjaCB1c2VyIHdpdGggdGhlIGdpdmVuIGlkXCI7XG5cbiAgIFVzZXIuZmluZE9uZSh7IGlkOiBpZH0sIGZ1bmN0aW9uKGVyciwgZXhpc3RpbmdVc2VyKSB7XG4gICAgaWYoZXJyKSB7XG4gICAgICByZXMuc2VuZChlcnIpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXMuanNvbihleGlzdGluZ1VzZXIpO1xuICAgIH1cbiAgIH0pO1xufSk7XG5cbi8vIFRoZSBtaWRkbGV3YXJlIHdpbGwgdmVyaWZ5IGNyZWRlbnRpYWxzXG4vLyBJZiBzdWNjZXNzZnVsLCBoYW5kIGEgdG9rZW5cbmFwcC5wb3N0KCcvc2lnbmluJywgcmVxdWlyZVNpZ25JbiwgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcblxuICAvLyBHZW5lcmF0ZSBhIHRva2VuXG4gIHZhciB0b2tlbiA9IGdlbmVyYXRlVG9rZW4ocmVxLnVzZXIpO1xuXG4gIC8vIFNlbmQgdXNlciBiYWNrIGEgSldUIHVwb24gc3VjY2Vzc2Z1bCBhY2NvdW50IGNyZWF0aW9uXG4gIHJlcy5qc29uKHt1c2VyOiByZXEudXNlciwgdG9rZW46IHRva2VufSk7XG59KTtcblxuYXBwLnBvc3QoJy9zaWdudXAnLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICB2YXIgbmFtZSA9IHJlcS5ib2R5Lm5hbWU7XG4gIHZhciBlbWFpbCA9IHJlcS5ib2R5LmVtYWlsO1xuICB2YXIgcGFzc3dvcmQgPSByZXEuYm9keS5wYXNzd29yZDtcbiAgdmFyIGdlbmRlciA9IHJlcS5ib2R5LmdlbmRlcjtcblxuICAvLyBWYWxpZGF0aW9uIHRvIGNoZWNrIGlmIGFsbCB0aGUgZmllbGRzIHdlcmUgYmVpbmcgcGFzc2VkXG4gIGlmKCFlbWFpbCB8fCAhcGFzc3dvcmQgfHwgIW5hbWUpe1xuICAgIHJldHVybiByZXMuc2VuZCg0MjIsIHtlcnJvcjogXCJQbGVhc2UgZmlsbCBvdXQgYWxsIHRoZSBmaWVsZHNcIn0pO1xuICB9XG5cbiAgLy8gQ2hlY2sgZW1haWwgYWxyZWFkeSBleGlzdHNcbiAgVXNlci5maW5kT25lKHsgZW1haWw6IGVtYWlsfSwgZnVuY3Rpb24oZXJyLCBleGlzdGluZ1VzZXIpIHtcblxuICAgIGlmKGVycikgeyByZXR1cm4gbmV4dChlcnIpOyB9XG5cbiAgICAvLyBJZiBpdCBkb2VzLCByZXR1cm4gXCJleGlzdGluZyBhY2NvdW50XCIgbWVzc2FnZVxuICAgIGlmKGV4aXN0aW5nVXNlcil7XG4gICAgICAvLyBSZXR1cm4gdW5wcm9jZXNzYWJsZSBlbnRpdHlcbiAgICAgIHJldHVybiByZXMuc2VuZCg0MjIsIHsgZXJyb3I6ICdFbWFpbCBpcyBpbiB1c2UnIH0pO1xuICAgIH1cblxuICAgIC8vIElmIG5vdCwgY3JlYXRlIGFuZCBzYXZlIHVzZXJcbiAgICB2YXIgdXNlciA9IG5ldyBVc2VyKHtcbiAgICAgIG5hbWU6IG5hbWUsXG4gICAgICBlbWFpbDogZW1haWwsXG4gICAgICBwYXNzd29yZDogcGFzc3dvcmQsXG4gICAgICBnZW5kZXI6IGdlbmRlclxuICAgIH0pO1xuXG4gICAgdXNlci5zYXZlKGZ1bmN0aW9uKGVycil7XG4gICAgICBpZiAoZXJyKSB7IHJldHVybiBuZXh0KGVycik7IH1cblxuICAgICAgLy8gR2VuZXJhdGUgYSB0b2tlblxuICAgICAgdmFyIHRva2VuID0gZ2VuZXJhdGVUb2tlbih1c2VyKTtcblxuICAgICAgLy8gU2VuZCB1c2VyIGJhY2sgYSBKV1QgdXBvbiBzdWNjZXNzZnVsIGFjY291bnQgY3JlYXRpb25cbiAgICAgIHJlcy5qc29uKHt1c2VyOiB1c2VyLCB0b2tlbjogdG9rZW59KTtcbiAgICB9KTtcblxuICB9KTtcblxufSk7XG5cbi8vIExvZyBvdXQgYSB1c2VyXG4vLyBOb3RlLCBSZWFjdCBSb3V0ZXIgaXMgY3VycmVudGx5IGhhbmRsaW5nIHRoaXNcbmFwcC5nZXQoJy9sb2dvdXQnLCBsb2dvdXQoKSwgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpe1xuICByZXMucmVkaXJlY3QoJy9sb2dpbicpO1xufSk7XG5cbi8vIFJvb3QgUGF0aFxuYXBwLmdldCgnKicsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIG1hdGNoKHsgcm91dGVzLCBsb2NhdGlvbjogcmVxLnVybCB9LCAoZXJyb3IsIHJlZGlyZWN0TG9jYXRpb24sIHJlbmRlclByb3BzKSA9PiB7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICByZXMuc3RhdHVzKDUwMCkuc2VuZChlcnJvci5tZXNzYWdlKVxuICAgIH0gZWxzZSBpZiAocmVkaXJlY3RMb2NhdGlvbikge1xuICAgICAgcmVzLnJlZGlyZWN0KDMwMiwgcmVkaXJlY3RMb2NhdGlvbi5wYXRobmFtZSArIHJlZGlyZWN0TG9jYXRpb24uc2VhcmNoKVxuICAgIH0gZWxzZSBpZiAocmVuZGVyUHJvcHMpIHtcbiAgICAgIC8vIFlvdSBjYW4gYWxzbyBjaGVjayByZW5kZXJQcm9wcy5jb21wb25lbnRzIG9yIHJlbmRlclByb3BzLnJvdXRlcyBmb3JcbiAgICAgIC8vIHlvdXIgXCJub3QgZm91bmRcIiBjb21wb25lbnQgb3Igcm91dGUgcmVzcGVjdGl2ZWx5LCBhbmQgc2VuZCBhIDQwNCBhc1xuICAgICAgLy8gYmVsb3csIGlmIHlvdSdyZSB1c2luZyBhIGNhdGNoLWFsbCByb3V0ZS5cbiAgICAgIHJlcy5zdGF0dXMoMjAwKS5zZW5kKHJlbmRlclRvU3RyaW5nKDxSb3V0ZXJDb250ZXh0IHsuLi5yZW5kZXJQcm9wc30gLz4pKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXMuc3RhdHVzKDQwNCkuc2VuZCgnTm90IGZvdW5kJylcbiAgICB9XG4gIH0pXG59KTtcblxudmFyIHBvcnQgPSBwcm9jZXNzLmVudi5QT1JUIHx8IDMwMDA7XG5cbmFwcC5saXN0ZW4ocG9ydCk7XG5jb25zb2xlLmxvZygnU2VydmVyIG5vdyBsaXN0ZW5pbmcgb24gcG9ydCAnICsgcG9ydCk7XG5cbm1vZHVsZS5leHBvcnRzID0gYXBwOyJdfQ==