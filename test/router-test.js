require('./helper');
var router = strata.router;

describe('router', function () {
  var app = router();

  var innerApp = function (env, callback) {
    var routeParams = env.route;
    assert.ok(routeParams);

    callback(200, {
      'Content-Type': 'text/plain',
      'X-Route': JSON.stringify(routeParams),
      'X-Id': String(routeParams.id)
    }, '');
  };

  app.route(/\/users\/(\d+)/i, innerApp);
  app.route('/posts/:id', innerApp, 'GET');
  app.route('/posts/:id', innerApp, ['POST', 'DELETE']);

  describe('when a match cannot be made', function () {
    beforeEach(function (callback) {
      call(app, '/', callback);
    });

    it('returns 404', function () {
      assert.equal(status, 404);
    });
  });

  describe('GET /users/1', function () {
    beforeEach(function (callback) {
      call(app, '/users/1', callback);
    });

    it('calls the correct app', function () {
      assert.ok(headers['X-Route']);
      assert.deepEqual(JSON.parse(headers['X-Route']), ['/users/1', '1']);
    });

    it('does not set the id route parameter', function () {
      assert.ok(headers['X-Id']);
      assert.equal(headers['X-Id'], 'undefined');
    });
  });

  describe('GET /posts/1', function () {
    beforeEach(function (callback) {
      call(app, '/posts/1', callback);
    });

    it('calls the correct app', function () {
      assert.ok(headers['X-Route']);
      assert.deepEqual(JSON.parse(headers['X-Route']), ['/posts/1', '1']);
    });

    it('sets the id route parameter', function () {
      assert.ok(headers['X-Id']);
      assert.equal(headers['X-Id'], '1');
    });
  });

  describe('POST /posts/2', function () {
    beforeEach(function (callback) {
      call(app, mock.env({
        requestMethod: 'POST',
        pathInfo: '/posts/2'
      }), callback);
    });

    it('calls the correct app', function () {
      assert.ok(headers['X-Route']);
      assert.deepEqual(JSON.parse(headers['X-Route']), ['/posts/2', '2']);
    });

    it('sets the id route parameter', function () {
      assert.ok(headers['X-Id']);
      assert.equal(headers['X-Id'], '2');
    });
  });

  describe('DELETE /posts/3', function () {
    beforeEach(function (callback) {
      call(app, mock.env({
        requestMethod: 'DELETE',
        pathInfo: '/posts/3'
      }), callback);
    });

    it('calls the correct app', function () {
      assert.ok(headers['X-Route']);
      assert.deepEqual(JSON.parse(headers['X-Route']), ['/posts/3', '3']);
    });

    it('sets the id route parameter', function () {
      assert.ok(headers['X-Id']);
      assert.equal(headers['X-Id'], '3');
    });
  });

  describe('PUT /posts/1', function () {
    beforeEach(function (callback) {
      call(app, mock.env({
        requestMethod: 'PUT',
        pathInfo: '/posts/1'
      }), callback);
    });

    it('returns 404', function () {
      assert.equal(status, 404);
    });
  });

  describe('with a router that returns an "X-Cascade: pass" header', function () {
    var app = router();

    app.route('/path', pass(idApp('1')));
    app.route('/path', idApp('2'));

    describe('when that route matches', function () {
      beforeEach(function (callback) {
        call(app, '/path', callback);
      });

      it('cascades to the next route', function () {
        assert.ok(headers['X-Id']);
        assert.equal(headers['X-Id'], '2');
      });
    });

    describe('when no routes match', function () {
      beforeEach(function (callback) {
        call(app, '/', callback);
      });

      it('returns the result of the default app', function () {
        assert.equal(status, 404);
      });
    });
  });
});

// Inserts the given id in an "X-Id" header in the response.
function idApp(id) {
  return function (env, callback) {
    callback(200, {
      'Content-Type': 'text/plain',
      'X-Id': id
    }, '');
  };
}

// Inserts an "X-Cascade: pass" header in the response.
function pass(app) {
  return function (env, callback) {
    app(env, function (status, headers, body) {
      headers['X-Cascade'] = 'pass';
      callback(status, headers, body);
    });
  };
}
