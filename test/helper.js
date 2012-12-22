assert = require('assert');
strata = require('../lib');
mock = strata.mock;
utils = strata.utils;

// These globals hold the result of the last call.
status = null;
headers = null;
body = null;

call = function (app, env, callback, returnBuffer) {
  mock.call(app, env, function (err, s, h, b) {
    status = s, headers = h, body = b;
    callback(err);
  }, returnBuffer);
};

checkStatus = function (code) {
  it('returns ' + code, function () {
    assert.equal(status, code);
  });
};

checkHeader = function (name, value) {
  it('returns the proper ' + name + ' header', function () {
    assert.equal(headers[name], value);
  });
};

assert.match = function (string, pattern, message) {
  assert.ok(string.match(pattern), message);
};

assert.empty = function (object, message) {
  assert.ok(utils.isEmptyObject(object), message);
};
