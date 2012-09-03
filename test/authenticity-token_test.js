var assert = require('assert');
var vows = require('vows');
var strata = require('../lib');
var sessionCookie = strata.sessionCookie;
var authenticityToken = strata.authenticityToken;
var mock = strata.mock;
var utils = strata.utils;

vows.describe('authenticityToken').addBatch({
  'An authenticityToken middleware': {
    topic: function () {
      return sessionCookie(authenticityToken(utils.ok));
    },
    'when the request is "safe"': {
      topic: function (app) {
        mock.call(app, '/', this.callback);
      },
      'returns 200': function (err, status, headers, body) {
        assert.equal(status, 200);
      }
    },
    'when the request is not "safe"': {
      topic: function (app) {
        this.requestMethod = 'POST';
        return app;
      },
      'and an X-Authenticity-Token header is not provided': {
        topic: function (app) {
          mock.call(app, mock.env({
            requestMethod: this.requestMethod
          }), this.callback);
        },
        'returns 403': function (err, status, headers, body) {
          assert.equal(status, 403);
        }
      },
      'and an X-Authenticity-Token header is provided': {
        'that matches the value in the session': {
          topic: function (app) {
            var env = mock.env({
              requestMethod: this.requestMethod,
              headers: {
                'X-Authenticity-Token': 'abc'
              }
            });

            env.session = {};
            env.session['strata.csrf'] = 'abc';

            mock.call(app, env, this.callback);
          },
          'returns 200': function (err, status, headers, body) {
            assert.equal(status, 200);
          }
        },
        'that does not match the value in the session': {
          topic: function (app) {
            var env = mock.env({
              requestMethod: this.requestMethod,
              headers: {
                'X-Authenticity-Token': 'abc'
              }
            });

            env.session = {};
            env.session['strata.csrf'] = 'def';

            mock.call(app, env, this.callback);
          },
          'return 403': function (err, status, headers, body) {
            assert.equal(status, 403);
          }
        }
      }
    }
  }
}).export(module);
