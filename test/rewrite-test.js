require('./helper');
var rewrite = strata.rewrite;

describe('rewrite', function () {
  var app = function (env, callback) {
    callback(200, {
      'Content-Type': 'text/plain',
      'X-Path-Info': env.pathInfo
    }, '');
  };

  app = rewrite(app, '/abc', '/xyz');
  app = rewrite(app, /\/def/g, '/xyz');

  describe('GET /abc', function () {
    beforeEach(function (callback) {
      call(app, '/abc', callback);
    });

    it('rewrites the pathInfo properly', function () {
      assert.ok(headers['X-Path-Info']);
      assert.equal(headers['X-Path-Info'], '/xyz');
    });
  });

  describe('GET /def', function () {
    beforeEach(function (callback) {
      call(app, '/def', callback);
    });

    it('rewrites the pathInfo properly', function () {
      assert.ok(headers['X-Path-Info']);
      assert.equal(headers['X-Path-Info'], '/xyz');
    });
  });

  describe('GET /def/path/def', function () {
    beforeEach(function (callback) {
      call(app, '/def/path/def', callback);
    });

    it('rewrites the pathInfo properly', function () {
      assert.ok(headers['X-Path-Info']);
      assert.equal(headers['X-Path-Info'], '/xyz/path/xyz');
    });
  });
});
