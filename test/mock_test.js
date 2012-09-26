var assert = require('assert');
var qs = require('querystring');
var vows = require('vows');
var strata = require('../lib');
var utils = strata.utils;
var mock = strata.mock;

vows.describe('mock').addBatch({
  'A mock request to utils.ok': {
    topic: function () {
      mock.call(utils.ok, '/', this.callback);
    },
    'should return a correct status code': function (err, status, headers, body) {
      assert.equal(status, 200);
    },
    'should return the correct headers': function (err, status, headers, body) {
      assert.deepEqual(headers, { 'Content-Type': 'text/plain', 'Content-Length': '2' });
    },
    'should return an OK body': function (err, status, headers, body) {
      assert.equal(body, 'OK');
    }
  },
  'A mock HEAD request': {
    topic: function () {
      var app = function (env, callback) {
        assert.equal(env.requestMethod, 'HEAD');
        utils.ok(env, callback);
      };

      mock.call(app, mock.env({
        requestMethod: 'HEAD'
      }), this.callback);
    },
    'should return a Content-Length of 0': function (err, status, headers, body) {
      assert.equal(headers['Content-Length'], '0');
    },
    'should return an empty body': function (err, status, headers, body) {
      assert.equal(body, '');
    }
  },
  'env': {
    'when given a params object in a GET request': {
      topic: function () {
        var env = mock.env({ requestMethod: 'GET', params: { a: 'a', b: 'b' } });
        return env.queryString;
      },
      'encodes it in the query string': function (queryString) {
        var data = qs.parse(queryString);
        assert.equal(data.a, 'a');
        assert.equal(data.b, 'b');
      }
    },
    'when given a params object in a POST request': {
      topic: function () {
        var env = mock.env({ requestMethod: 'POST', params: { a: 'a', b: 'b' } });
        var body = '';

        env.input.on('data', function (chunk) {
          body += chunk.toString('utf8');
        });

        var callback = this.callback;
        env.input.on('end', function () {
          callback(null, body);
        });
      },
      'encodes it in the body': function (body) {
        var data = qs.parse(body);
        assert.equal(data.a, 'a');
        assert.equal(data.b, 'b');
      }
    }
  }
}).export(module);
