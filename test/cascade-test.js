require('./helper');
var cascade = strata.cascade;

describe('cascade', function () {
  var apps = [
    generateApp(0, 404),
    generateApp(1, 404),
    generateApp(2, 200)
  ];

  var app = cascade(apps, 404);

  beforeEach(function (callback) {
    call(app, '/', callback)
  });

  it('returns the response of the first app that does not return 404', function () {
    assert.equal(headers['X-Number'], '2');
  });
});

function generateApp(n, status) {
  status = status || 404;

  return function (env, callback) {
    callback(status, {
      'Content-Type': 'text/plain',
      'X-Number': n.toString()
    }, '');
  };
}
