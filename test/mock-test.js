require('./helper');
var qs = require('querystring');
var crypto = require('crypto');

describe('mock', function () {

  describe('a request to utils.ok', function () {
    beforeEach(function (callback) {
      call(utils.ok, '/', callback);
    });

    it('returns 200', function () {
      assert.equal(status, 200);
    });

    it('returns the correct headers', function () {
      assert.equal(headers['Content-Type'], 'text/plain');
      assert.equal(headers['Content-Length'], '2');
    });

    it('returns the correct body', function () {
      assert.equal(body, 'OK');
    });
  });

  describe('a HEAD request to utils.ok', function () {
    var app = function (env, callback) {
      assert.equal(env.requestMethod, 'HEAD');
      utils.ok(env, callback);
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

  describe('env', function () {
    describe('when given a params object in a GET request', function () {
      var queryString;
      beforeEach(function () {
        var env = mock.env({ requestMethod: 'GET', params: { a: 'a', b: 'b' } });
        queryString = env.queryString;
      });

      it('encodes it in the query string', function () {
        var data = qs.parse(queryString);
        assert.equal(data.a, 'a');
        assert.equal(data.b, 'b');
      });
    });

    describe('when given a params object in a POST request', function () {
      var input;
      beforeEach(function (callback) {
        var env = mock.env({ requestMethod: 'POST', params: { a: 'a', b: 'b' } });
        utils.bufferStream(env.input, function (err, buffer) {
          input = buffer.toString();
          callback(err);
        });
      });

      it('encodes it in the body', function () {
        var data = qs.parse(input);
        assert.equal(data.a, 'a');
        assert.equal(data.b, 'b');
      });
    });
  });

});
