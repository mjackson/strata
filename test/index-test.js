require('./helper');
var Stream = require('stream').Stream;
var BufferedStream = require('bufferedstream');

describe('strata', function () {
  describe('a HEAD request to stream OK response with length', function () {
    var app = function (env, callback) {
      assert.equal(env.requestMethod, 'HEAD');
      callback(200, { 'Content-Length': 2 }, BufferedStream('OK'));
    };

    beforeEach(function (callback) {
      call(app, mock.env({
        requestMethod: 'HEAD'
      }), callback);
    });

    it('returns a Content-Length of 2', function () {
      assert.equal(headers['Content-Length'], '2');
    });

    it('returns an empty body', function () {
      assert.equal(body, '');
    });
  });

  describe('a HEAD request to stream OK response w/o length', function () {
    var app = function (env, callback) {
      assert.equal(env.requestMethod, 'HEAD');
      callback(200, {}, BufferedStream('OK'));
    };

    beforeEach(function (callback) {
      call(app, mock.env({
        requestMethod: 'HEAD'
      }), callback);
    });

    it('returns a Transfer-Encoding of chunked', function () {
      assert.equal(headers['Transfer-Encoding'], 'chunked');
    });

    it('returns an empty body', function () {
      assert.equal(body, '');
    });
  });

  describe('handleError', function () {
    var returnValue;
    var app = function (env, callback) {
      returnValue = strata.handleError(new Error('Boom!'), env, callback);
    };

    var error;
    beforeEach(function (callback) {
      error = {};
      call(app, { error: error }, callback);
    });

    it('returns 500', function () {
      assert.equal(status, 500);
    });

    it('returns a boolean', function () {
      assert.equal(typeof returnValue, 'boolean');
    });

    it('writes to the error stream', function () {
      assert(error.data);
    });
  });
});
