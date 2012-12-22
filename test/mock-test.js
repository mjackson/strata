require('./helper');
var qs = require('querystring');
var crypto = require('crypto');
var BufferedStream = require('bufferedstream');

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

  describe('a binary streaming response with many chunks', function () {
    var stream = new BufferedStream();
    var digester = crypto.createHash('sha1');
    var app = function (env, callback) {
      process.nextTick(function () {
        for (var i = 0; i < 10; i++) {
          var b = new Buffer(crypto.randomBytes(10));
          digester.update(b);
          stream.write(b);
        }
        stream.end();
      });
      callback(200, {}, stream);
    };

    beforeEach(function (callback) {
      call(app, '/', callback, true);
    });

    it('returns a Buffer whose digest matches that passed in', function (done) {
      var resultDigest = crypto.createHash('sha1').update(body).digest('hex');
      var expectedDigest = digester.digest('hex');
      assert.equal(resultDigest, expectedDigest);
      done();
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
        env.input.resume();

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
