// var express = require('express');
var expect = require('chai').expect;
var mongoose = require('mongoose');
var User = require('../../server/models/user.js');

// the models for the database
// var Stack = require('../server/models/stackdata.js');
// var Users = require('../server/models/stackdata.js');

/////////////////////////////////////////////////////
// NOTE: these tests are designed for mongo!
/////////////////////////////////////////////////////

describe('User Model', function () {

  it('should be a Mongoose model', function () {
    expect(new User()).to.be.instanceOf(mongoose.Model);
  });

  it('should have a schema', function () {
    expect(User.schema).to.exist;
  });


});
