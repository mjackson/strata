require('./helper');
var flash = strata.flash;

describe('flash', function () {
  var app = flash(function (env, callback) {
    callback(200, {
      'Content-Type': 'text/plain',
      'Content-Length': '0',
      'X-Flash': String(env.flash)
    }, '');
  });

  describe('when a flash message already exists in the environment', function () {
    var flashMessage = 'Hello world.';
    beforeEach(function (callback) {
      var env = mock.env();
      flash.set(env, flashMessage);
      call(app, env, callback);
    });

    it('sets the flash environment variable', function () {
      assert.equal(headers['X-Flash'], flashMessage);
    });
  });
});
