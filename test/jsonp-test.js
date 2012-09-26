require('./helper');
var BufferedStream = require("bufferedstream");
var jsonp = strata.jsonp;

describe('jsonp', function () {
  describe('with a string body', function () {
    var content = JSON.stringify({ message: "Hello world!" });
    var app = jsonp(function (env, callback) {
      callback(200, { "Content-Type": "application/json" }, content);
    });

    beforeEach(function (callback) {
      call(app, '/', callback);
    });

    it('wraps the body in a JavaScript callback', function () {
      assert.equal(headers["Content-Type"], "application/javascript");
      assert.equal(body, "callback(" + content + ")");
    });
  });

  describe('with a custom callback name', function () {
    var content = JSON.stringify({ message: "Hello world!" });
    var callbackName = 'aCallback';
    var app = jsonp(function (env, callback) {
      callback(200, { "Content-Type": "application/json" }, content);
    }, callbackName);

    beforeEach(function (callback) {
      call(app, '/', callback);
    });

    it('wraps the body in a JavaScript callback with that name', function () {
      assert.equal(headers["Content-Type"], "application/javascript");
      assert.equal(body, callbackName + "(" + content + ")");
    });
  });

  describe('when the request contains a "callback" parameter', function () {
    var content = JSON.stringify({ message: "Hello world!" });
    var callbackName = 'aCallback';
    var app = jsonp(function (env, callback) {
      callback(200, { "Content-Type": "application/json" }, content);
    });

    beforeEach(function (callback) {
      call(app, '/?callback=' + callbackName, callback);
    });

    it('wraps the body in a JavaScript callback with that name', function () {
      assert.equal(headers["Content-Type"], "application/javascript");
      assert.equal(body, callbackName + "(" + content + ")");
    });
  });

  describe('with a stream body', function () {
    var content = JSON.stringify({ message: "Hello world!" });
    var app = jsonp(function (env, callback) {
      callback(200, { "Content-Type": "application/json" }, new BufferedStream(content));
    });

    beforeEach(function (callback) {
      call(app, '/', callback);
    });

    it('wraps the body in a JavaScript callback', function () {
      assert.equal(headers["Content-Type"], "application/javascript");
      assert.equal(body, "callback(" + content + ")");
    });
  });
});
