require('./helper');
var build = strata.build;

describe('build', function () {
  var app = build();

  app.use(echoRoot);
  app.use(incCount);

  app.map('/one', function (app) {
    app.run(function (env, callback) {
      callback(200, {
        'Content-Type': 'text/plain',
        'X-Position': 'one'
      }, '');
    });
  });

  app.use(incCount);

  app.map('/two', function (app) {
    app.run(function (env, callback) {
      callback(200, {
        'Content-Type': 'text/plain',
        'X-Position': 'two'
      }, '');
    });
  });

  app.use(incCount);

  describe('when a non-existent route is requested', function () {
    beforeEach(function (callback) {
      call(app, '/doesnt-exist', callback);
    });

    it('calls all middleware', function () {
      assert.equal(headers['X-Count'], '3');
    });

    it('maps to the root of the server', function () {
      assert.equal(headers['X-Position'], 'root');
    });
  });

  describe('when /one is requested', function () {
    beforeEach(function (callback) {
      call(app, '/one', callback);
    });

    it('calls all middleware in front of the call to map', function () {
      assert.equal(headers['X-Count'], '1');
    });

    it('properly maps', function () {
      assert.equal(headers['X-Position'], 'one');
    });
  });

  describe('when /two is requested', function () {
    beforeEach(function (callback) {
      call(app, '/two', callback);
    });

    it('calls all middleware in front of the call to map', function () {
      assert.equal(headers['X-Count'], '2');
    });

    it('properly maps', function () {
      assert.equal(headers['X-Position'], 'two');
    });
  });
});

// Increments the X-Count header when called.
function incCount(app) {
  return function (env, callback) {
    app(env, function (status, headers, body) {
      headers['X-Count'] = (parseInt(headers['X-Count'] || 0) + 1).toString();
      callback(status, headers, body);
    });
  }
}

// Sets the X-Position header to "root" if it hasn't been set.
function echoRoot(app) {
  return function (env, callback) {
    app(env, function (status, headers, body) {
      headers['X-Position'] = headers['X-Position'] || 'root';
      callback(status, headers, body);
    });
  }
}
