require('./helper');
var path = require('path');
var directory = strata.directory;

describe('directory', function () {
  describe('when the request targets a directory that is present', function () {
    var app = directory(utils.notFound, __dirname);

    beforeEach(function (callback) {
      call(app, '/', callback);
    });

    it('returns 200', function () {
      assert.equal(status, 200);
    });

    it('returns a directory listing of that directory', function () {
      var pattern = new RegExp(path.basename(__filename));
      assert.ok(body.match(pattern));
    });
  });

  describe('when the request targets a directory that is present', function () {
    var app = directory(utils.notFound, __dirname);

    beforeEach(function (callback) {
      call(app, '/does-not-exist', callback);
    });

    it('passes the request downstream', function () {
      assert.equal(status, 404);
    });
  });
});
