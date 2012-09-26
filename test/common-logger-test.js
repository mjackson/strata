require('./helper');
var commonLogger = strata.commonLogger;

describe('commonLogger', function () {
  var output;
  var app = commonLogger(utils.ok, {
    write: function (message) {
      output += message;
    }
  });

  beforeEach(function (callback) {
    output = '';
    call(app, '/', callback);
  });

  it('logs the request', function () {
    assert.ok(output.match(/GET \/.+200/));
  });
});
