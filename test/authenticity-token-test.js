require('./helper');
var sessionCookie = strata.sessionCookie;
var authenticityToken = strata.authenticityToken;

describe('authenticityToken', function () {
  var app = sessionCookie(echoToken(authenticityToken(utils.ok)));

  describe('when the request is "safe"', function () {
    beforeEach(function (callback) {
      call(app, '/', callback);
    });

    it('returns 200', function () {
      assert.equal(status, 200);
    });

    it('generates a token', function () {
      assert(headers['X-Authenticity-Token']);
    });
  });

  describe('when the request is not "safe"', function () {
    var requestMethod = 'POST';

    describe('and an X-Authenticity-Token header is not provided', function () {
      beforeEach(function (callback) {
        call(app, mock.env({ requestMethod: requestMethod }), callback);
      });

      it('returns 403', function () {
        assert.equal(status, 403);
      });
    });

    describe('and an X-Authenticity-Token header is provided', function () {
      describe('that matches the value in the session', function () {
        beforeEach(function (callback) {
          var env = mock.env({
            requestMethod: requestMethod,
            headers: {
              'X-Authenticity-Token': 'abc'
            }
          });

          env.session = {};
          env.session['strata.csrf'] = 'abc';

          call(app, env, callback);
        });

        it('returns 200', function () {
          assert.equal(status, 200);
        });
      });

      describe('that does not match the value in the session', function () {
        beforeEach(function (callback) {
          var env = mock.env({
            requestMethod: requestMethod,
            headers: {
              'X-Authenticity-Token': 'abc'
            }
          });

          env.session = {};
          env.session['strata.csrf'] = 'def';

          call(app, env, callback);
        });

        it('returns 403', function () {
          assert.equal(status, 403);
        });
      });
    });
  });
});

function echoToken(app) {
  return function (env, callback) {
    app(env, function (status, headers, body) {
      headers['X-Authenticity-Token'] = env.session['strata.csrf'];
      callback(status, headers, body);
    });
  }
}
