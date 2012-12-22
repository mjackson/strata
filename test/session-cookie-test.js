require('./helper');
var sessionCookie = strata.sessionCookie;

describe('sessionCookie', function () {
  var app = sessionCookie(increment);

  describe('when the cookie is ok', function () {
    it('properly serializes/deserializes cookie data', function () {
      var sync = false;

      call(app, '/', function (err) {
        assert.ok(!err);
        assert.ok(headers['Set-Cookie']);
        var match = headers['Set-Cookie'].match(/(strata\.session=[^;]+)/);
        assert.ok(match);
        assert.equal(JSON.parse(body).counter, 1);

        call(app, mock.env({
          headers: {
            'Cookie': match[1]
          }
        }), function (err) {
          sync = true;
          assert.ok(!err);
          assert.ok(headers['Set-Cookie']);
          assert.equal(JSON.parse(body).counter, 2);
        });
      });

      assert.ok(sync);
    });
  });

  describe('when the cookie has been tampered with', function () {
    it('erases the cookie data', function () {
      var sync = false;

      call(app, '/', function (err) {
        assert.ok(!err);
        assert.ok(headers['Set-Cookie']);
        var match = headers['Set-Cookie'].match(/(strata\.session=[^;]+)/);
        assert.ok(match);
        assert.deepEqual(JSON.parse(body).counter, 1);

        // Tamper with the cookie.
        var cookie = match[1].substring(0, match[1].length - 2);

        call(app, mock.env({
          headers: {
            'Cookie': cookie
          }
        }), function (err) {
          sync = true;
          assert.ok(!err);
          assert.ok(headers['Set-Cookie']);
          assert.deepEqual(JSON.parse(body).counter, 1);
        });
      });

      assert.ok(sync);
    });
  });

  describe('when the cookie size exceeds 4k', function () {
    var app = sessionCookie(toobig);

    var stream;
    beforeEach(function (callback) {
      stream = {};
      call(app, mock.env({
        error: mock.stream(stream)
      }), callback);
    });

    it('does not set the cookie', function () {
      assert.ok(!headers['Set-Cookie']);
    });

    it('drops content', function () {
      assert.ok(stream.data.match(/content dropped/i));
    });
  });

  describe('when the cookie contains a -- it properly deserializes', function () {
    var app = sessionCookie(includeDelimiter);
    it('doesn\'t wrongly overwrite the session.', function () {
      var sync = false;
      call(app, '/', function (err) {
        assert.ok(!err);
        assert.ok(headers['Set-Cookie']);
        var match = headers['Set-Cookie'].match(/(strata\.session=[^;]+)/);
        assert.ok(match);
        assert.equal(JSON.parse(body).counter, 1);

        call(app, mock.env({
          headers: {
            'Cookie': match[1]
          }
        }), function (err) {
          sync = true;
          assert.ok(!err);
          assert.ok(headers['Set-Cookie']);
          assert.equal(JSON.parse(body).counter, 2);
        });
      });

      assert.ok(sync);
    });
  });
});

function stringify(env, callback) {
  var content = JSON.stringify(env.session || {});

  callback(200, {
    'Content-Type': 'text/plain',
    'Content-Length': Buffer.byteLength(content)
  }, content);
}

function increment(env, callback) {
  assert.ok(env.session);

  if (!('counter' in env.session)) {
    env.session.counter = 0;
  }

  env.session.counter += 1;

  stringify(env, callback);
}

function toobig(env, callback) {
  assert.ok(env.session);

  var value = '';

  for (var i = 0; i < 4096; ++i) {
    value += 'a';
  }

  env.session.value = value;

  stringify(env, callback);
}

function includeDelimiter(env, callback) {
  assert.ok(env.session);

  if (!('counter' in env.session)) {
    env.session.counter = 0;
  }

  env.session.counter += 1;
  env.session.quote = 'The double hyphen "--" is often used in the *real* world.';

  stringify(env, callback);
}
