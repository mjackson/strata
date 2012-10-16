require('./helper');
var BufferedStream = require('bufferedstream');
var contentLength = strata.contentLength;

describe('contentLength', function () {
  describe('with a string body', function () {
    var body = 'Hello world!';
    var length = String(body.length);
    var app = contentLength(function (env, callback) {
      callback(200, { 'Content-Type': 'text/plain' }, body);
    });

    beforeEach(function (callback) {
      call(app, '/', callback);
    });

    it('adds a Content-Length header', function () {
      assert.equal(headers['Content-Length'], length);
    });
  });

  describe('with a stream body', function () {
    var error;
    beforeEach(function (callback) {
      error = {};

      var body = new BufferedStream('Hello world!');
      var app = contentLength(function (env, callback) {
        callback(200, { 'Content-Type': 'text/plain' }, body);
      });

      call(app, mock.env({ error: mock.stream(error) }), callback);
    });

    it('writes to the error stream', function () {
      assert.ok(error.data.match(/body with no length/));
    });
  });
});
