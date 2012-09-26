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
    var body;
    var app = contentLength(function (env, callback) {
      callback(200, { 'Content-Type': 'text/plain' }, body);
    });

    var stream;
    beforeEach(function (callback) {
      body = new BufferedStream('Hello world!');
      body.pause();
      stream = {};
      call(app, mock.env({ error: mock.stream(stream) }), callback);
      body.resume();
    });

    it('writes to the error stream', function () {
      assert.ok(stream.data.match(/body with no length/));
    });
  });
});
