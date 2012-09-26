require('./helper');
var timeout = strata.timeout;

describe('timeout', function () {
  var app = timeout(function (env, callback) {
    // Wait 20ms before sending the response.
    setTimeout(function () {
      utils.ok(env, callback);
    }, 20);
  }, 10);

  beforeEach(function (callback) {
    call(app, "/", callback);
  });

  it('times out the request', function () {
    assert.equal(status, 500);
  });
});
