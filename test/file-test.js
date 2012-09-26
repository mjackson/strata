require('./helper');
var path = require('path');
var fs = require('fs');
var file = strata.file;

describe('file', function () {
  var filename = path.basename(__filename);
  var contents = fs.readFileSync(__filename, 'utf8');

  describe('with a single index file', function () {
    var app = file(utils.notFound, __dirname, filename);

    describe('when a file is requested', function () {
      beforeEach(function (callback) {
        call(app, '/' + filename, callback);
      });

      it('returns 200', function () {
        assert.equal(status, 200);
      });

      it('serves that file', function () {
        assert.equal(body, contents);
      });

      it('sets the correct Content-Type', function () {
        assert.equal(headers['Content-Type'], 'application/javascript');
      });
    });

    describe('when a directory is requested', function () {
      beforeEach(function (callback) {
        call(app, '/', callback);
      });

      it('returns 200', function () {
        assert.equal(status, 200);
      });

      it('serves the index file', function () {
        assert.equal(body, contents);
      });

      it('sets the correct Content-Type', function () {
        assert.equal(headers['Content-Type'], 'application/javascript');
      });
    });

    describe('when a matching file cannot be found', function () {
      beforeEach(function (callback) {
        call(app, '/does-not-exist', callback);
      });

      it('forwards the request to the downstream app', function () {
        assert.equal(status, 404);
      });
    });

    describe('when the path contains ".."', function () {
      beforeEach(function (callback) {
        call(app, '/../etc/passwd', callback);
      });

      it('returns 403', function () {
        assert.equal(status, 403);
      });
    });
  });

  describe('with multiple index files', function () {
    var app = file(utils.notFound, __dirname, ['index.html', filename]);

    describe('when a directory is requested', function () {
      beforeEach(function (callback) {
        call(app, '/', callback);
      });

      it('returns 200', function () {
        assert.equal(status, 200);
      });

      it('serves the first index file that exists', function () {
        assert.equal(body, contents);
      });

      it('sets the correct Content-Type', function () {
        assert.equal(headers['Content-Type'], 'application/javascript');
      });
    });
  });
});
