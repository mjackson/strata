require('./helper');
var redirect = strata.redirect;

describe('redirect', function () {
  var location = '/login';
  var app = function (env, callback) {
    redirect(env, callback, location);
  };

  beforeEach(function (callback) {
    call(app, '/', callback);
  });

  it('returns 302', function () {
    assert.equal(status, 302);
  });

  it('redirects to the proper location', function () {
    assert.equal(headers['Location'], location);
  });

  describe('.forward', function () {
    var location = '/login';
    var app = echoReferrer(function (env, callback) {
      redirect.forward(env, callback, location);
    });

    beforeEach(function (callback) {
      call(app, '/admin', callback);
    });

    it('returns 302', function () {
      assert.equal(status, 302);
    });

    it('redirects to the proper location', function () {
      assert.equal(headers['Location'], location);
    });

    it('records the current location in the session', function () {
      assert.equal(headers['X-Referrer'], '/admin');
    });
  });

  describe('.back', function () {
    var location = '/admin';
    var app = forwardLocation(function (env, callback) {
      redirect.back(env, callback);
    }, location);

    beforeEach(function (callback) {
      call(app, '/', callback);
    });

    it('returns 302', function () {
      assert.equal(status, 302);
    });

    it('redirects to the proper location', function () {
      assert.equal(headers['Location'], location);
    });

    it('deletes the old location from the session', function () {
      assert.equal(headers['X-Referrer'], '');
    });
  });
});

function echoReferrer(app) {
  return function (env, callback) {
    app(env, function (status, headers, body) {
      headers['X-Referrer'] = env.session['strata.referrer'];
      callback(status, headers, body);
    });
  };
}

function forwardLocation(app, location) {
  return function (env, callback) {
    // Simulate redirect.forward
    env.session = { 'strata.referrer': location };

    app(env, function (status, headers, body) {
      headers['X-Referrer'] = env.session['strata.referrer'] || '';
      callback(status, headers, body);
    });
  };
}
