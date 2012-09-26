require('./helper');
var methodOverride = strata.methodOverride;

describe('methodOverride', function () {
  var app = methodOverride(function (env, callback) {
    callback(200, {
      'Content-Type': 'text/plain',
      'X-Request-Method': env.requestMethod
    }, '');
  });

  describe('when using GET', function () {
    beforeEach(function (callback) {
      call(app, '/?_method=put', callback);
    });

    it('returns 200', function () {
      assert.equal(status, 200);
    });

    it('does not modify the request method', function () {
      assert.equal(headers['X-Request-Method'], 'GET');
    });
  });

  describe('when using POST with a method in the queryString', function () {
    beforeEach(function (callback) {
      call(app, mock.env({
        requestMethod: 'POST',
        queryString: '_method=put'
      }), callback);
    });

    it('returns 200', function () {
      assert.equal(status, 200);
    });

    it('modifies the request method', function () {
      assert.equal(headers['X-Request-Method'], 'PUT');
    });
  });

  describe('when using POST with a method in the post body', function () {
    beforeEach(function (callback) {
      call(app, mock.env({
        requestMethod: 'POST',
        input: '_method=put'
      }), callback);
    });

    it('returns 200', function () {
      assert.equal(status, 200);
    });

    it('modifies the request method', function () {
      assert.equal(headers['X-Request-Method'], 'PUT');
    });
  });

  describe('when using POST with a method in the HTTP headers', function () {
    beforeEach(function (callback) {
      call(app, mock.env({
        requestMethod: 'POST',
        headers: {
          'X-Http-Method-Override': 'put'
        }
      }), callback);
    });

    it('returns 200', function () {
      assert.equal(status, 200);
    });

    it('modifies the request method', function () {
      assert.equal(headers['X-Request-Method'], 'PUT');
    });
  });
});
