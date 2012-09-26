require('./helper');
var path = require('path');
var fs = require('fs');
var BufferedStream = require('bufferedstream');
var gzip = strata.gzip;
var file = strata.file;

describe('gzip', function () {
  var testFile = path.resolve(__dirname, '_files/test.txt');
  var contents = fs.readFileSync(testFile, 'utf8');
  var gzippedContents = fs.readFileSync(testFile + '.gz', 'utf8');

  describe('with a string body', function () {
    var app = gzip(function (env, callback) {
      callback(200, { 'Content-Type': 'text/plain' }, contents);
    });

    beforeEach(function (callback) {
      call(app, mock.env({
        headers: {
          'Accept-Encoding': 'gzip, *'
        }
      }), callback);
    });

    it('gzip-encodes the response', function () {
      assert.equal(headers['Content-Encoding'], 'gzip');
      assert.equal(body, gzippedContents);
    });
  });

  describe('with a stream body', function () {
    var app = gzip(function (env, callback) {
      callback(200, { 'Content-Type': 'text/plain' }, new BufferedStream(contents));
    });

    beforeEach(function (callback) {
      call(app, mock.env({
        headers: {
          'Accept-Encoding': 'gzip, *'
        }
      }), callback);
    });

    it('gzip-encodes the response', function () {
      assert.equal(headers['Content-Encoding'], 'gzip');
      assert.equal(body, gzippedContents);
    });
  });

  describe('with a file body', function () {
    var app = gzip(file(utils.notFound, path.resolve(__dirname, '_files')));

    beforeEach(function (callback) {
      call(app, mock.env({
        pathInfo: '/test.txt',
        headers: {
          'Accept-Encoding': 'gzip, *'
        }
      }), callback);
    });

    it('gzip-encodes the response', function () {
      assert.equal(headers['Content-Encoding'], 'gzip');
      assert.equal(body, gzippedContents);
    });
  });

  describe('when the client does not accept gzip encoding', function () {
    var app = gzip(function (env, callback) {
      callback(200, { 'Content-Type': 'text/plain' }, contents);
    });

    beforeEach(function (callback) {
      call(app, '/', callback);
    });

    it('does not gzip-encode the body', function () {
      assert.equal(headers['Content-Type'], 'text/plain');
      assert.ok(!headers['Content-Encoding']);
      assert.equal(body, contents);
    });
  });
});
