require('./helper');
var basicAuth = strata.basicAuth;

describe('basicAuth', function () {
  describe('when no validation function is given', function () {
    it('throws', function () {
      assert.throws(function () {
        var app = basicAuth(utils.ok);
      }, /validation function/);
    });
  });

  describe('when authorization fails', function () {
    beforeEach(function (callback) {
      var user = 'michael';
      var pass = 's3krit';
      var credentials = new Buffer(user + ':' + pass).toString('base64');
      var app = basicAuth(utils.ok, function (user, pass, callback) {
        callback(null, false);
      });

      call(app, mock.env({
        headers: {
          'Authorization': 'Basic ' + credentials
        }
      }), callback);
    });

    it('returns 401', function () {
      assert.equal(status, 401);
    });

    it('returns a WWW-Authenticate header', function () {
      assert.ok(headers['WWW-Authenticate']);
    });
  });

  describe('when authorization succeeds', function () {
    beforeEach(function (callback) {
      var user = 'michael';
      var pass = 's3krit';
      var credentials = new Buffer(user + ':' + pass).toString('base64');
      var app = basicAuth(function (env, callback) {
        callback(200, {
          'Content-Type': 'text/plain',
          'X-Remote-User': env.remoteUser
        }, '');
      }, function (user, pass, callback) {
        callback(null, user);
      });

      call(app, mock.env({
        headers: {
          'Authorization': 'Basic ' + credentials
        }
      }), callback);
    });

    it('forwards the request downstream', function () {
      assert.equal(status, 200);
    });

    it('sets the remoteUser environment variable', function () {
      assert.equal(headers['X-Remote-User'], 'michael');
    });
  });
});
