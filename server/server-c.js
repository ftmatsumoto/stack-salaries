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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNlcnZlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7OztBQUNBLElBQUksU0FBUyxRQUFRLHVCQUFSLEVBQWlDLE9BQTlDO0FBQ0EsSUFBSSxLQUFLLFFBQVEsbUNBQVIsQ0FBVDs7QUFFQSxJQUFJLE1BQU0sd0JBQVY7O0FBRUEsSUFBSSxHQUFKLENBQVEsc0JBQU8sS0FBUCxDQUFSO0FBQ0EsSUFBSSxHQUFKLENBQVEscUJBQVcsVUFBWCxDQUFzQixFQUFFLFVBQVUsSUFBWixFQUF0QixDQUFSO0FBQ0EsSUFBSSxHQUFKLENBQVEscUJBQVcsSUFBWCxFQUFSO0FBQ0EsSUFBSSxHQUFKLENBQVEsa0JBQVEsTUFBUixDQUFlLGVBQUssSUFBTCxDQUFVLFNBQVYsRUFBcUIsb0JBQXJCLENBQWYsQ0FBUjs7O0FBSUEsSUFBSSxjQUFjLFFBQVEsR0FBUixDQUFZLFdBQVosSUFBMEIsMENBQTVDOztBQUVBLG1CQUFTLE9BQVQsQ0FBaUIsV0FBakI7OztBQUdBLFNBQVMsYUFBVCxDQUF1QixJQUF2QixFQUE0Qjs7O0FBRzFCLE1BQUksWUFBWSxJQUFJLElBQUosR0FBVyxPQUFYLEVBQWhCO0FBQ0EsU0FBTyxvQkFBSSxNQUFKLENBQVcsRUFBRSxLQUFLLEtBQUssRUFBWixFQUFnQixLQUFLLFNBQXJCLEVBQVgsRUFBNkMsaUJBQU8sTUFBcEQsQ0FBUDtBQUNEOzs7OztBQUtELElBQUksY0FBYyxtQkFBUyxZQUFULENBQXNCLEtBQXRCLEVBQTZCLEVBQUUsU0FBUyxLQUFYLEVBQTdCLENBQWxCO0FBQ0EsSUFBSSxnQkFBZ0IsbUJBQVMsWUFBVCxDQUFzQixPQUF0QixFQUErQixFQUFFLFNBQVMsS0FBWCxFQUEvQixDQUFwQjtBQUNBLElBQUksYUFBYSxtQkFBUyxZQUFULENBQXNCLFFBQXRCLEVBQWdDLEVBQUUsU0FBUyxLQUFYLEVBQWtCLGlCQUFpQixHQUFuQyxFQUF3QyxpQkFBaUIsUUFBekQsRUFBaEMsQ0FBakI7OztBQUdBLElBQUksR0FBSixDQUFRLEdBQVIsRUFBYSxVQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLElBQW5CLEVBQXlCOztBQUVwQyxNQUFJLE1BQUosQ0FBVyw2QkFBWCxFQUEwQyxHQUExQzs7QUFFQSxNQUFJLE1BQUosQ0FBVyw4QkFBWCxFQUEyQyx3QkFBM0M7O0FBRUEsTUFBSSxNQUFKLENBQVcsOEJBQVgsRUFBMkMsY0FBM0M7O0FBRUE7QUFFRCxDQVZEOzs7QUFhQSxJQUFJLElBQUosQ0FBUyxTQUFULEVBQW9CLFVBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsSUFBbkIsRUFBeUI7QUFDM0MsS0FBRyxXQUFILENBQWUsSUFBSSxJQUFuQixFQUF5QixVQUFTLE9BQVQsRUFBa0I7QUFDekMsUUFBSSxJQUFKLENBQVMsT0FBVDtBQUNELEdBRkQ7QUFHRCxDQUpEOzs7QUFPQSxJQUFJLElBQUosQ0FBUyxhQUFULEVBQXdCLFVBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsSUFBbkIsRUFBeUI7O0FBRS9DLEtBQUcsWUFBSCxDQUFnQixJQUFJLElBQXBCLEVBQTBCLFVBQVMsTUFBVCxFQUFpQjtBQUN6QyxRQUFJLE1BQUosQ0FBVyxHQUFYO0FBQ0EsUUFBSSxJQUFKLENBQVMsTUFBVDtBQUNELEdBSEQ7QUFJRCxDQU5EOztBQVFBLElBQUksR0FBSixDQUFRLFlBQVIsRUFBc0IsVUFBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixJQUFuQixFQUF5QjtBQUM3QyxpQkFBSyxJQUFMLENBQVUsRUFBVixFQUFjLFVBQVMsR0FBVCxFQUFjLEtBQWQsRUFBcUI7QUFDakMsUUFBSSxHQUFKLEVBQVM7QUFBRSxhQUFPLEtBQUssR0FBTCxDQUFQO0FBQWtCO0FBQzdCLFFBQUksU0FBUyxFQUFiO0FBQ0EsUUFBSSxPQUFPLEVBQVg7QUFDQSxVQUFNLE9BQU4sQ0FBYyxVQUFTLElBQVQsRUFBZTtBQUMzQixXQUFLLFFBQUwsQ0FBYyxPQUFkLENBQXNCLFVBQVMsTUFBVCxFQUFpQjtBQUNyQyxZQUFJLFFBQVEsT0FBTyxLQUFuQjtBQUNBLFlBQUksV0FBVyxNQUFNLEtBQU4sQ0FBWSxJQUFaLENBQWY7QUFDQSxZQUFJLFNBQVMsTUFBVCxHQUFrQixDQUF0QixFQUF5QjtBQUN2QixtQkFBUyxPQUFULENBQWlCLFVBQVMsS0FBVCxFQUFnQjtBQUMvQixtQkFBTyxLQUFQLElBQWdCLE9BQU8sS0FBUCxHQUFoQixHQUFrQyxPQUFPLEtBQVAsSUFBZ0IsQ0FBbEQ7QUFDRCxXQUZEO0FBR0QsU0FKRCxNQUlPO0FBQ0wsaUJBQU8sS0FBUCxJQUFnQixPQUFPLEtBQVAsR0FBaEIsR0FBa0MsT0FBTyxLQUFQLElBQWdCLENBQWxEO0FBQ0Q7QUFDRixPQVZEO0FBV0QsS0FaRDs7QUFjQSxTQUFLLElBQUksR0FBVCxJQUFnQixNQUFoQixFQUF3QjtBQUN0QixXQUFLLElBQUwsQ0FBVSxFQUFDLE9BQU8sR0FBUixFQUFhLE9BQU8sT0FBTyxHQUFQLENBQXBCLEVBQVY7QUFDRDs7QUFFRCxRQUFJLElBQUosQ0FBUyxFQUFDLFFBQVEsSUFBVCxFQUFUO0FBQ0QsR0F2QkQ7QUF3QkQsQ0F6QkQ7OztBQTRCQSxJQUFJLEdBQUosQ0FBUSxRQUFSLEVBQWtCLFdBQWxCLEVBQStCLFVBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsSUFBbkIsRUFBeUI7QUFDdEQsaUJBQUssSUFBTCxDQUFVLEVBQVYsRUFBYyxVQUFTLEdBQVQsRUFBYyxLQUFkLEVBQXFCO0FBQ2pDLFFBQUcsQ0FBQyxHQUFKLEVBQVM7QUFDUCxVQUFJLElBQUosQ0FBUyxFQUFDLFlBQUQsRUFBVDtBQUNELEtBRkQsTUFFTztBQUNMLFlBQU0sR0FBTjtBQUNEO0FBQ0YsR0FORDtBQU9ELENBUkQ7Ozs7QUFZQSxJQUFJLEdBQUosQ0FBUSxPQUFSLEVBQWlCLFVBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsSUFBbkIsRUFBeUI7QUFDeEMsaUJBQUssSUFBTCxDQUFVLEVBQUMsT0FBTyxJQUFJLEtBQUosQ0FBVSxLQUFsQixFQUFWLEVBQW9DLFVBQVMsR0FBVCxFQUFjLElBQWQsRUFBb0I7QUFDdEQsUUFBSSxHQUFKLEVBQVM7QUFBQyxjQUFRLEdBQVIsQ0FBWSxHQUFaO0FBQWtCO0FBQzVCLFFBQUksTUFBSixDQUFXLEdBQVgsRUFBZ0IsSUFBaEIsQ0FBcUIsSUFBckI7QUFDRCxHQUhEO0FBSUQsQ0FMRDs7QUFPQSxJQUFJLEdBQUosQ0FBUSxZQUFSLEVBQXNCLFVBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsSUFBbkIsRUFBeUI7QUFDN0MsTUFBSSxLQUFLLElBQUksTUFBSixDQUFXLEVBQXBCOzs7QUFHQSxNQUFJLE1BQU0sZ0NBQVY7O0FBRUMsaUJBQUssT0FBTCxDQUFhLEVBQUUsSUFBSSxFQUFOLEVBQWIsRUFBd0IsVUFBUyxHQUFULEVBQWMsWUFBZCxFQUE0QjtBQUNuRCxRQUFHLEdBQUgsRUFBUTtBQUNOLFVBQUksSUFBSixDQUFTLEdBQVQ7QUFDRCxLQUZELE1BRU87QUFDTCxVQUFJLElBQUosQ0FBUyxZQUFUO0FBQ0Q7QUFDRCxHQU5EO0FBT0YsQ0FiRDs7OztBQWlCQSxJQUFJLElBQUosQ0FBUyxTQUFULEVBQW9CLGFBQXBCLEVBQW1DLFVBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsSUFBbkIsRUFBeUI7OztBQUcxRCxNQUFJLFFBQVEsY0FBYyxJQUFJLElBQWxCLENBQVo7OztBQUdBLE1BQUksSUFBSixDQUFTLEVBQUMsTUFBTSxJQUFJLElBQVgsRUFBaUIsT0FBTyxLQUF4QixFQUFUO0FBQ0QsQ0FQRDs7QUFTQSxJQUFJLElBQUosQ0FBUyxTQUFULEVBQW9CLFVBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsSUFBbkIsRUFBeUI7QUFDM0MsTUFBSSxPQUFPLElBQUksSUFBSixDQUFTLElBQXBCO0FBQ0EsTUFBSSxRQUFRLElBQUksSUFBSixDQUFTLEtBQXJCO0FBQ0EsTUFBSSxXQUFXLElBQUksSUFBSixDQUFTLFFBQXhCO0FBQ0EsTUFBSSxTQUFTLElBQUksSUFBSixDQUFTLE1BQXRCOzs7QUFHQSxNQUFHLENBQUMsS0FBRCxJQUFVLENBQUMsUUFBWCxJQUF1QixDQUFDLElBQTNCLEVBQWdDO0FBQzlCLFdBQU8sSUFBSSxJQUFKLENBQVMsR0FBVCxFQUFjLEVBQUMsT0FBTyxnQ0FBUixFQUFkLENBQVA7QUFDRDs7O0FBR0QsaUJBQUssT0FBTCxDQUFhLEVBQUUsT0FBTyxLQUFULEVBQWIsRUFBOEIsVUFBUyxHQUFULEVBQWMsWUFBZCxFQUE0Qjs7QUFFeEQsUUFBRyxHQUFILEVBQVE7QUFBRSxhQUFPLEtBQUssR0FBTCxDQUFQO0FBQW1COzs7QUFHN0IsUUFBRyxZQUFILEVBQWdCOztBQUVkLGFBQU8sSUFBSSxJQUFKLENBQVMsR0FBVCxFQUFjLEVBQUUsT0FBTyxpQkFBVCxFQUFkLENBQVA7QUFDRDs7O0FBR0QsUUFBSSxPQUFPLG1CQUFTO0FBQ2xCLFlBQU0sSUFEWTtBQUVsQixhQUFPLEtBRlc7QUFHbEIsZ0JBQVUsUUFIUTtBQUlsQixjQUFRLE1BSlU7QUFLbEIsYUFBTyxJQUxXO0FBTWxCLGlCQUFXO0FBTk8sS0FBVCxDQUFYOztBQVNBLFNBQUssSUFBTCxDQUFVLFVBQVMsR0FBVCxFQUFhO0FBQ3JCLFVBQUksR0FBSixFQUFTO0FBQUUsZUFBTyxLQUFLLEdBQUwsQ0FBUDtBQUFtQjs7O0FBRzlCLFVBQUksUUFBUSxjQUFjLElBQWQsQ0FBWjs7O0FBR0EsVUFBSSxJQUFKLENBQVMsRUFBQyxNQUFNLElBQVAsRUFBYSxPQUFPLEtBQXBCLEVBQVQ7QUFDRCxLQVJEO0FBVUQsR0E5QkQ7QUFnQ0QsQ0E1Q0Q7O0FBOENBLElBQUksSUFBSixDQUFTLFlBQVQsRUFBdUIsVUFBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixJQUFuQixFQUF5QjtBQUM5QyxpQkFBSyxPQUFMLENBQWEsRUFBQyxPQUFPLElBQUksSUFBSixDQUFTLEtBQWpCLEVBQWIsRUFBc0MsVUFBUyxHQUFULEVBQWMsSUFBZCxFQUFvQjtBQUN4RCxRQUFJLEdBQUosRUFBUztBQUFFLGFBQU8sS0FBSyxHQUFMLENBQVA7QUFBa0I7QUFDN0IsWUFBUSxHQUFSLENBQVksWUFBWixFQUEwQixJQUFJLElBQUosQ0FBUyxLQUFuQztBQUNBLFNBQUssS0FBTCxHQUFhLElBQUksSUFBSixDQUFTLEtBQXRCO0FBQ0EsU0FBSyxJQUFMLENBQVUsVUFBUyxHQUFULEVBQWM7QUFDdEIsVUFBSSxHQUFKLEVBQVM7QUFBRSxlQUFPLEtBQUssR0FBTCxDQUFQO0FBQWtCO0FBQzdCLFVBQUksSUFBSixDQUFTLEVBQUMsVUFBRCxFQUFUO0FBQ0QsS0FIRDtBQUlELEdBUkQ7QUFTRCxDQVZEOztBQVlBLElBQUksSUFBSixDQUFTLFdBQVQsRUFBc0IsVUFBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixJQUFuQixFQUF5QjtBQUM3QyxpQkFBSyxPQUFMLENBQWEsRUFBQyxPQUFPLElBQUksSUFBSixDQUFTLEtBQWpCLEVBQWIsRUFBc0MsVUFBUyxHQUFULEVBQWMsSUFBZCxFQUFvQjtBQUN4RCxRQUFJLEdBQUosRUFBUztBQUFDLGFBQU8sS0FBSyxHQUFMLENBQVA7QUFBaUI7QUFDM0IsUUFBSSxJQUFKLENBQVMsRUFBQyxVQUFELEVBQVQ7QUFDRCxHQUhEO0FBSUQsQ0FMRDs7OztBQVNBLElBQUksSUFBSixDQUFTLFNBQVQsRUFBb0IsVUFBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixJQUFuQixFQUF3QjtBQUMxQyxpQkFBSyxPQUFMLENBQWEsRUFBQyxPQUFPLElBQUksSUFBSixDQUFTLEtBQWpCLEVBQWIsRUFBc0MsVUFBUyxHQUFULEVBQWMsSUFBZCxFQUFvQjtBQUN4RCxRQUFJLElBQUosRUFBVTtBQUNSLFdBQUssS0FBTCxHQUFhLElBQWI7QUFDQSxXQUFLLElBQUwsQ0FBVSxVQUFTLEdBQVQsRUFBYztBQUN0QixZQUFJLEdBQUosRUFBUztBQUFDLGlCQUFPLEtBQUssR0FBTCxDQUFQO0FBQWlCO0FBQzNCLFlBQUksSUFBSixDQUFTLEVBQUMsU0FBUyxJQUFWLEVBQVQ7QUFDRCxPQUhEO0FBSUQsS0FORCxNQU1PO0FBQ0wsVUFBSSxJQUFKLENBQVMsRUFBQyxTQUFTLEtBQVYsRUFBVDtBQUNEO0FBQ0YsR0FWRDtBQVdELENBWkQ7OztBQWVBLElBQUksR0FBSixDQUFRLEdBQVIsRUFBYSxVQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLElBQW5CLEVBQXlCO0FBQ3BDLDBCQUFNLEVBQUUsY0FBRixFQUFVLFVBQVUsSUFBSSxHQUF4QixFQUFOLEVBQXFDLFVBQUMsS0FBRCxFQUFRLGdCQUFSLEVBQTBCLFdBQTFCLEVBQTBDO0FBQzdFLFFBQUksS0FBSixFQUFXO0FBQ1QsVUFBSSxNQUFKLENBQVcsR0FBWCxFQUFnQixJQUFoQixDQUFxQixNQUFNLE9BQTNCO0FBQ0QsS0FGRCxNQUVPLElBQUksZ0JBQUosRUFBc0I7QUFDM0IsVUFBSSxRQUFKLENBQWEsR0FBYixFQUFrQixpQkFBaUIsUUFBakIsR0FBNEIsaUJBQWlCLE1BQS9EO0FBQ0QsS0FGTSxNQUVBLElBQUksV0FBSixFQUFpQjs7OztBQUl0QixVQUFJLE1BQUosQ0FBVyxHQUFYLEVBQWdCLElBQWhCLENBQXFCLDRCQUFlLDBEQUFtQixXQUFuQixDQUFmLENBQXJCO0FBQ0QsS0FMTSxNQUtBO0FBQ0wsVUFBSSxNQUFKLENBQVcsR0FBWCxFQUFnQixJQUFoQixDQUFxQixXQUFyQjtBQUNEO0FBQ0YsR0FiRDtBQWNELENBZkQ7O0FBaUJBLElBQUksT0FBTyxRQUFRLEdBQVIsQ0FBWSxJQUFaLElBQW9CLElBQS9COztBQUVBLElBQUksTUFBSixDQUFXLElBQVg7QUFDQSxRQUFRLEdBQVIsQ0FBWSxrQ0FBa0MsSUFBOUM7O0FBRUEsT0FBTyxPQUFQLEdBQWlCLEdBQWpCIiwiZmlsZSI6InNlcnZlci1jLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgYm9keVBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgbW9yZ2FuIGZyb20gJ21vcmdhbic7XG5pbXBvcnQgbW9uZ29vc2UgZnJvbSAnbW9uZ29vc2UnO1xuaW1wb3J0IFVzZXIgZnJvbSAnLi9tb2RlbHMvdXNlcic7XG5pbXBvcnQgU3RhY2tEYXRhIGZyb20gJy4vbW9kZWxzL3N0YWNrZGF0YSc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBjb3JzIGZyb20gJ2NvcnMnO1xuaW1wb3J0IGJjcnlwdCBmcm9tICdiY3J5cHQtbm9kZWpzJztcbmltcG9ydCBqd3QgZnJvbSAnand0LXNpbXBsZSc7XG5pbXBvcnQgc2VjcmV0IGZyb20gJy4vc2VjcmV0JztcbmltcG9ydCBwYXNzcG9ydEF1dGggZnJvbSAnLi9wYXNzcG9ydC9wYXNzcG9ydCc7XG5pbXBvcnQgbG9jYWxBdXRoIGZyb20gJy4vcGFzc3BvcnQvbG9jYWwnO1xuaW1wb3J0IGdpdGh1YiBmcm9tICcuL3Bhc3Nwb3J0L2dpdGh1Yic7XG5pbXBvcnQgcGFzc3BvcnQgZnJvbSAncGFzc3BvcnQnO1xuaW1wb3J0IGxvZ291dCBmcm9tICdleHByZXNzLXBhc3Nwb3J0LWxvZ291dCc7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgcmVuZGVyVG9TdHJpbmcgfSBmcm9tICdyZWFjdC1kb20vc2VydmVyJ1xuaW1wb3J0IHsgbWF0Y2gsIFJvdXRlckNvbnRleHQgfSBmcm9tICdyZWFjdC1yb3V0ZXInXG52YXIgcm91dGVzID0gcmVxdWlyZSgnLi9jb21waWxlZC9zcmMvYnVuZGxlJykuZGVmYXVsdDtcbnZhciBTRCA9IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvc3RhY2tkYXRhQ29udHJvbGxlcicpO1xuXG52YXIgYXBwID0gZXhwcmVzcygpO1xuXG5hcHAudXNlKG1vcmdhbignZGV2JykpO1xuYXBwLnVzZShib2R5UGFyc2VyLnVybGVuY29kZWQoeyBleHRlbmRlZDogdHJ1ZSB9KSk7XG5hcHAudXNlKGJvZHlQYXJzZXIuanNvbigpKTtcbmFwcC51c2UoZXhwcmVzcy5zdGF0aWMocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL2NsaWVudC9jb21waWxlZCcpKSk7XG5cblxuLy8gTW9uZ29vc2UgQ29ubmVjdGlvbiAoUmVmYWN0b3IgaW50byBTZXBhcmF0ZSBGaWxlKVxudmFyIGRhdGFiYXNlVVJMID0gcHJvY2Vzcy5lbnYuTU9OR09EQl9VUkkgfHwnbW9uZ29kYjovL2xvY2FsaG9zdDoyNzAxNy9zdGFjay1zYWxhcmllcydcblxubW9uZ29vc2UuY29ubmVjdChkYXRhYmFzZVVSTCk7XG5cbi8vIEhlbHBlciBNZXRob2RzIChSZWZhY3RvciBpbnRvIFNlcGFyYXRlIEZpbGUpXG5mdW5jdGlvbiBnZW5lcmF0ZVRva2VuKHVzZXIpe1xuICAvLyBBZGQgaXNzdWVkIGF0IHRpbWVzdGFtcCBhbmQgc3ViamVjdFxuICAvLyBCYXNlZCBvbiB0aGUgSldUIGNvbnZlbnRpb25cbiAgdmFyIHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICByZXR1cm4gand0LmVuY29kZSh7IHN1YjogdXNlci5pZCwgaWF0OiB0aW1lc3RhbXAgfSwgc2VjcmV0LnNlY3JldCk7XG59XG5cbi8vIFNldCB0byBmYWxzZSBzaW5jZSB0b2tlbnMgYXJlIGJlaW5nIHVzZWRcbi8vIFRoaXMgaXMgUGFzc3BvcnQgQXV0aGVudGljYXRpb24gc2V0dXBcbi8vIEdpdGh1YiBhdXRoIHdpbGwgYmUgYWRkZWQgaGVyZSBhcyB3ZWxsXG52YXIgcmVxdWlyZUF1dGggPSBwYXNzcG9ydC5hdXRoZW50aWNhdGUoJ2p3dCcsIHsgc2Vzc2lvbjogZmFsc2UgfSApO1xudmFyIHJlcXVpcmVTaWduSW4gPSBwYXNzcG9ydC5hdXRoZW50aWNhdGUoJ2xvY2FsJywgeyBzZXNzaW9uOiBmYWxzZSB9KTtcbnZhciBnaXRodWJBdXRoID0gcGFzc3BvcnQuYXV0aGVudGljYXRlKCdnaXRodWInLCB7IHNlc3Npb246IGZhbHNlLCBzdWNjZXNzUmVkaXJlY3Q6ICcvJywgZmFpbHVyZVJlZGlyZWN0OiAnL2xvZ2luJ30pO1xuXG4vLyBBbGxvdyBhbGwgaGVhZGVyc1xuYXBwLmFsbCgnKicsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB74oCoXG4gIHJlcy5oZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk74oCoXG4gIHJlcy5oZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnLCAnUFVULCBHRVQsIFBPU1QsIERFTEVURScpO+KAqFxuICByZXMuaGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJywgJ0NvbnRlbnQtVHlwZScpO+KAqFxuICBuZXh0KCk74oCoXG59KTtcblxuLy9TZWFyY2ggZm9yIGFueSBmaWVsZFxuYXBwLnBvc3QoJy9zZWFyY2gnLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICBTRC5xdWVyeVNhbGFyeShyZXEuYm9keSwgZnVuY3Rpb24ocmVzdWx0cykge1xuICAgIHJlcy5qc29uKHJlc3VsdHMpO1xuICB9KTtcbn0pO1xuXG4vLyBBZGQgYSBTdGFjayBFbnRyeVxuYXBwLnBvc3QoJy9zdGFja2VudHJ5JywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgLy8gY29uc29sZS5sb2cocmVxLmJvZHkpO1xuICBTRC5jcmVhdGVTYWxhcnkocmVxLmJvZHksIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgIHJlcy5zdGF0dXMoMjAxKTtcbiAgICByZXMuanNvbihyZXN1bHQpO1xuICB9KTtcbn0pO1xuXG5hcHAuZ2V0KCcvZ2V0c3RhY2tzJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgVXNlci5maW5kKHt9LCBmdW5jdGlvbihlcnIsIHVzZXJzKSB7XG4gICAgaWYgKGVycikgeyByZXR1cm4gbmV4dChlcnIpIH1cbiAgICB2YXIgc3RhY2tzID0ge307XG4gICAgdmFyIGRhdGEgPSBbXTtcbiAgICB1c2Vycy5mb3JFYWNoKGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgIHVzZXIudXNlckRhdGEuZm9yRWFjaChmdW5jdGlvbihzYWxhcnkpIHtcbiAgICAgICAgdmFyIHN0YWNrID0gc2FsYXJ5LnN0YWNrO1xuICAgICAgICB2YXIgc3RhY2tBcnIgPSBzdGFjay5zcGxpdCgnLCAnKTtcbiAgICAgICAgaWYgKHN0YWNrQXJyLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICBzdGFja0Fyci5mb3JFYWNoKGZ1bmN0aW9uKHN0YWNrKSB7XG4gICAgICAgICAgICBzdGFja3Nbc3RhY2tdID8gc3RhY2tzW3N0YWNrXSsrIDogc3RhY2tzW3N0YWNrXSA9IDE7XG4gICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdGFja3Nbc3RhY2tdID8gc3RhY2tzW3N0YWNrXSsrIDogc3RhY2tzW3N0YWNrXSA9IDE7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGZvciAodmFyIGtleSBpbiBzdGFja3MpIHtcbiAgICAgIGRhdGEucHVzaCh7dmFsdWU6IGtleSwgY291bnQ6IHN0YWNrc1trZXldfSk7XG4gICAgfVxuXG4gICAgcmVzLmpzb24oe3N0YWNrczogZGF0YX0pO1xuICB9KVxufSlcblxuLy8gR0VUIGFsbCB1c2Vyc1xuYXBwLmdldCgnL3VzZXJzJywgcmVxdWlyZUF1dGgsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIFVzZXIuZmluZCh7fSwgZnVuY3Rpb24oZXJyLCB1c2Vycykge1xuICAgIGlmKCFlcnIpIHtcbiAgICAgIHJlcy5qc29uKHt1c2Vyc30pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9KTtcbn0pO1xuXG4vLyBHRVQgZGF0YSBmcm9tIG9uZSB1c2VyXG4vLyBmaW5kaW5nIHVzZXIgYnkgbmFtZTpcImFhYWFhXCIsIGNoYW5nZSBhZnRlciBhZGQgdG9rZW4gdG8gZGF0YWJhc2VcbmFwcC5nZXQoJy91c2VyJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgVXNlci5maW5kKHt0b2tlbjogcmVxLnF1ZXJ5LnRva2VufSwgZnVuY3Rpb24oZXJyLCB1c2VyKSB7XG4gICAgaWYgKGVycikge2NvbnNvbGUubG9nKGVycik7fVxuICAgIHJlcy5zdGF0dXMoMjAwKS5zZW5kKHVzZXIpO1xuICB9KTtcbn0pO1xuXG5hcHAuZ2V0KCcvdXNlcnMvOmlkJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgdmFyIGlkID0gcmVxLnBhcmFtcy5pZDtcblxuICAvLyBBIGZyaWVuZGx5IGVycm9yIHRvIGRpc3BsYXkgaWYgbm8gdXNlciBtYXRjaGVzIHRoZSBpZFxuICB2YXIgZXJyID0gXCJObyBzdWNoIHVzZXIgd2l0aCB0aGUgZ2l2ZW4gaWRcIjtcblxuICAgVXNlci5maW5kT25lKHsgaWQ6IGlkfSwgZnVuY3Rpb24oZXJyLCBleGlzdGluZ1VzZXIpIHtcbiAgICBpZihlcnIpIHtcbiAgICAgIHJlcy5zZW5kKGVycik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcy5qc29uKGV4aXN0aW5nVXNlcik7XG4gICAgfVxuICAgfSk7XG59KTtcblxuLy8gVGhlIG1pZGRsZXdhcmUgd2lsbCB2ZXJpZnkgY3JlZGVudGlhbHNcbi8vIElmIHN1Y2Nlc3NmdWwsIGhhbmQgYSB0b2tlblxuYXBwLnBvc3QoJy9zaWduaW4nLCByZXF1aXJlU2lnbkluLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuXG4gIC8vIEdlbmVyYXRlIGEgdG9rZW5cbiAgdmFyIHRva2VuID0gZ2VuZXJhdGVUb2tlbihyZXEudXNlcik7XG5cbiAgLy8gU2VuZCB1c2VyIGJhY2sgYSBKV1QgdXBvbiBzdWNjZXNzZnVsIGFjY291bnQgY3JlYXRpb25cbiAgcmVzLmpzb24oe3VzZXI6IHJlcS51c2VyLCB0b2tlbjogdG9rZW59KTtcbn0pO1xuXG5hcHAucG9zdCgnL3NpZ251cCcsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIHZhciBuYW1lID0gcmVxLmJvZHkubmFtZTtcbiAgdmFyIGVtYWlsID0gcmVxLmJvZHkuZW1haWw7XG4gIHZhciBwYXNzd29yZCA9IHJlcS5ib2R5LnBhc3N3b3JkO1xuICB2YXIgZ2VuZGVyID0gcmVxLmJvZHkuZ2VuZGVyO1xuXG4gIC8vIFZhbGlkYXRpb24gdG8gY2hlY2sgaWYgYWxsIHRoZSBmaWVsZHMgd2VyZSBiZWluZyBwYXNzZWRcbiAgaWYoIWVtYWlsIHx8ICFwYXNzd29yZCB8fCAhbmFtZSl7XG4gICAgcmV0dXJuIHJlcy5zZW5kKDQyMiwge2Vycm9yOiBcIlBsZWFzZSBmaWxsIG91dCBhbGwgdGhlIGZpZWxkc1wifSk7XG4gIH1cblxuICAvLyBDaGVjayBlbWFpbCBhbHJlYWR5IGV4aXN0c1xuICBVc2VyLmZpbmRPbmUoeyBlbWFpbDogZW1haWx9LCBmdW5jdGlvbihlcnIsIGV4aXN0aW5nVXNlcikge1xuXG4gICAgaWYoZXJyKSB7IHJldHVybiBuZXh0KGVycik7IH1cblxuICAgIC8vIElmIGl0IGRvZXMsIHJldHVybiBcImV4aXN0aW5nIGFjY291bnRcIiBtZXNzYWdlXG4gICAgaWYoZXhpc3RpbmdVc2VyKXtcbiAgICAgIC8vIFJldHVybiB1bnByb2Nlc3NhYmxlIGVudGl0eVxuICAgICAgcmV0dXJuIHJlcy5zZW5kKDQyMiwgeyBlcnJvcjogJ0VtYWlsIGlzIGluIHVzZScgfSk7XG4gICAgfVxuXG4gICAgLy8gSWYgbm90LCBjcmVhdGUgYW5kIHNhdmUgdXNlclxuICAgIHZhciB1c2VyID0gbmV3IFVzZXIoe1xuICAgICAgbmFtZTogbmFtZSxcbiAgICAgIGVtYWlsOiBlbWFpbCxcbiAgICAgIHBhc3N3b3JkOiBwYXNzd29yZCxcbiAgICAgIGdlbmRlcjogZ2VuZGVyLFxuICAgICAgdG9rZW46IG51bGwsXG4gICAgICBmaXJzdFNhdmU6IHRydWVcbiAgICB9KTtcblxuICAgIHVzZXIuc2F2ZShmdW5jdGlvbihlcnIpe1xuICAgICAgaWYgKGVycikgeyByZXR1cm4gbmV4dChlcnIpOyB9XG5cbiAgICAgIC8vIEdlbmVyYXRlIGEgdG9rZW5cbiAgICAgIHZhciB0b2tlbiA9IGdlbmVyYXRlVG9rZW4odXNlcik7XG5cbiAgICAgIC8vIFNlbmQgdXNlciBiYWNrIGEgSldUIHVwb24gc3VjY2Vzc2Z1bCBhY2NvdW50IGNyZWF0aW9uXG4gICAgICByZXMuanNvbih7dXNlcjogdXNlciwgdG9rZW46IHRva2VufSk7XG4gICAgfSk7XG5cbiAgfSk7XG5cbn0pO1xuXG5hcHAucG9zdCgnL3NhdmV0b2tlbicsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIFVzZXIuZmluZE9uZSh7ZW1haWw6IHJlcS5ib2R5LmVtYWlsfSwgZnVuY3Rpb24oZXJyLCB1c2VyKSB7XG4gICAgaWYgKGVycikgeyByZXR1cm4gbmV4dChlcnIpIH1cbiAgICBjb25zb2xlLmxvZygnU0FWRSBUT0tFTicsIHJlcS5ib2R5LnRva2VuKTtcbiAgICB1c2VyLnRva2VuID0gcmVxLmJvZHkudG9rZW47XG4gICAgdXNlci5zYXZlKGZ1bmN0aW9uKGVycikge1xuICAgICAgaWYgKGVycikgeyByZXR1cm4gbmV4dChlcnIpIH1cbiAgICAgIHJlcy5qc29uKHt1c2VyfSk7XG4gICAgfSlcbiAgfSlcbn0pXG5cbmFwcC5wb3N0KCcvbG9nZ2VkSW4nLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICBVc2VyLmZpbmRPbmUoe3Rva2VuOiByZXEuYm9keS50b2tlbn0sIGZ1bmN0aW9uKGVyciwgdXNlcikge1xuICAgIGlmIChlcnIpIHtyZXR1cm4gbmV4dChlcnIpfVxuICAgIHJlcy5qc29uKHt1c2VyfSk7XG4gIH0pXG59KVxuXG4vLyBMb2cgb3V0IGEgdXNlclxuLy8gTm90ZSwgUmVhY3QgUm91dGVyIGlzIGN1cnJlbnRseSBoYW5kbGluZyB0aGlzXG5hcHAucG9zdCgnL2xvZ291dCcsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KXtcbiAgVXNlci5maW5kT25lKHt0b2tlbjogcmVxLmJvZHkudG9rZW59LCBmdW5jdGlvbihlcnIsIHVzZXIpIHtcbiAgICBpZiAodXNlcikge1xuICAgICAgdXNlci50b2tlbiA9IG51bGw7XG4gICAgICB1c2VyLnNhdmUoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGlmIChlcnIpIHtyZXR1cm4gbmV4dChlcnIpfVxuICAgICAgICByZXMuanNvbih7ZGVsZXRlZDogdHJ1ZX0pO1xuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzLmpzb24oe2RlbGV0ZWQ6IGZhbHNlfSk7XG4gICAgfVxuICB9KVxufSk7XG5cbi8vIFJvb3QgUGF0aFxuYXBwLmdldCgnKicsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIG1hdGNoKHsgcm91dGVzLCBsb2NhdGlvbjogcmVxLnVybCB9LCAoZXJyb3IsIHJlZGlyZWN0TG9jYXRpb24sIHJlbmRlclByb3BzKSA9PiB7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICByZXMuc3RhdHVzKDUwMCkuc2VuZChlcnJvci5tZXNzYWdlKVxuICAgIH0gZWxzZSBpZiAocmVkaXJlY3RMb2NhdGlvbikge1xuICAgICAgcmVzLnJlZGlyZWN0KDMwMiwgcmVkaXJlY3RMb2NhdGlvbi5wYXRobmFtZSArIHJlZGlyZWN0TG9jYXRpb24uc2VhcmNoKVxuICAgIH0gZWxzZSBpZiAocmVuZGVyUHJvcHMpIHtcbiAgICAgIC8vIFlvdSBjYW4gYWxzbyBjaGVjayByZW5kZXJQcm9wcy5jb21wb25lbnRzIG9yIHJlbmRlclByb3BzLnJvdXRlcyBmb3JcbiAgICAgIC8vIHlvdXIgXCJub3QgZm91bmRcIiBjb21wb25lbnQgb3Igcm91dGUgcmVzcGVjdGl2ZWx5LCBhbmQgc2VuZCBhIDQwNCBhc1xuICAgICAgLy8gYmVsb3csIGlmIHlvdSdyZSB1c2luZyBhIGNhdGNoLWFsbCByb3V0ZS5cbiAgICAgIHJlcy5zdGF0dXMoMjAwKS5zZW5kKHJlbmRlclRvU3RyaW5nKDxSb3V0ZXJDb250ZXh0IHsuLi5yZW5kZXJQcm9wc30gLz4pKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXMuc3RhdHVzKDQwNCkuc2VuZCgnTm90IGZvdW5kJylcbiAgICB9XG4gIH0pXG59KTtcblxudmFyIHBvcnQgPSBwcm9jZXNzLmVudi5QT1JUIHx8IDMwMDA7XG5cbmFwcC5saXN0ZW4ocG9ydCk7XG5jb25zb2xlLmxvZygnU2VydmVyIG5vdyBsaXN0ZW5pbmcgb24gcG9ydCAnICsgcG9ydCk7XG5cbm1vZHVsZS5leHBvcnRzID0gYXBwO1xuIl19
