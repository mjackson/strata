require('./helper');
var contentType = strata.contentType;

describe('contentType', function () {
  var type = "text/plain";
  var app = contentType(function (env, callback) {
    callback(200, {}, "");
  }, type);

  beforeEach(function (callback) {
    call(app, '/', callback);
  });

  it('adds a Content-Type header', function () {
    assert.strictEqual(headers["Content-Type"], type);
  });
});
