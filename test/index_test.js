var EventEmitter = require("events").EventEmitter;
var assert = require("assert");
var vows = require("vows");
var BufferedStream = require("bufferedstream");
var strata = require("../lib");
var utils = strata.utils;
var mock = strata.mock;

vows.describe("index").addBatch({
  "env": {
    topic: function () {
      this.protocol = "https:";
      this.protocolVersion = "1.1";
      this.requestMethod = "POST";
      this.requestTime = new Date;
      this.remoteAddr = "127.0.0.1";
      this.remotePort = "8888";
      this.serverName = "example.org";
      this.serverPort = "443";
      this.pathInfo = "/some/path";
      this.queryString = "a=1&b=2";
      this.userAgent = "test suite";
      this.content = "hello world!";
      this.contentLength = String(Buffer.byteLength(this.content));

      return strata.env({
        protocol: this.protocol,
        protocolVersion: this.protocolVersion,
        requestMethod: this.requestMethod,
        requestTime: this.requestTime,
        remoteAddr: this.remoteAddr,
        remotePort: this.remotePort,
        serverName: this.serverName,
        serverPort: this.serverPort,
        pathInfo: this.pathInfo,
        queryString: this.queryString,
        headers: {
          "Host": this.serverName,
          "User-Agent": this.userAgent,
          "Content-Length": this.contentLength
        },
        input: new BufferedStream(this.content)
      });
    },
    "should have the correct protocol": function (env) {
      assert.equal(env.protocol, this.protocol);
    },
    "should have the correct protocolVersion": function (env) {
      assert.equal(env.protocolVersion, this.protocolVersion);
    },
    "should have the correct requestMethod": function (env) {
      assert.equal(env.requestMethod, this.requestMethod);
    },
    "should have the correct requestTime": function (env) {
      assert.equal(env.requestTime, this.requestTime);
    },
    "should have the correct remoteAddr": function (env) {
      assert.equal(env.remoteAddr, this.remoteAddr);
    },
    "should have the correct remotePort": function (env) {
      assert.equal(env.remotePort, this.remotePort);
    },
    "should have the correct serverName": function (env) {
      assert.equal(env.serverName, this.serverName);
    },
    "should have the correct serverPort": function (env) {
      assert.equal(env.serverPort, this.serverPort);
    },
    "should have an empty scriptName": function (env) {
      assert.equal(env.scriptName, "");
    },
    "should have the correct pathInfo": function (env) {
      assert.equal(env.pathInfo, this.pathInfo);
    },
    "should have the correct queryString": function (env) {
      assert.equal(env.queryString, this.queryString);
    },
    "should have the correct headers": function (env) {
      assert.equal(env.headers['host'], this.serverName);
      assert.equal(env.headers['user-agent'], this.userAgent);
      assert.equal(env.headers['content-length'], this.contentLength);
    },
    "version": {
      topic: function (env) {
        this.callback(null, env.strataVersion);
      },
      "should be the current version of Strata": function (version) {
        assert.deepEqual(version, strata.version);
      }
    },
    "input": {
      topic: function (env) {
        var input = env.input,
          content = "",
          self = this;

        assert.ok(input);

        input.resume();

        input.on("data", function (buffer) {
          content += buffer.toString("utf8");
        });

        input.on("end", function () {
          self.callback(null, content);
        });
      },
      "should contain the entire content string": function (content) {
        assert.equal(content, this.content);
      }
    },
    "error": {
      topic: function (env) {
        this.callback(null, env.error);
      },
      "should be a writable Stream": function (error) {
        assert.ok(error);
        assert.instanceOf(error, EventEmitter);
        assert.ok(error.writable);
      }
    }
  },
  "handleError": {
    topic: function () {
      var returnValue;

      var env = {
        error: mock.stream(this)
      };

      var innerApp = function (env, callback) {
        var err = new strata.Error("Bang!");
        returnValue = strata.handleError(err, env, callback);
      };

      var app = function (env, callback) {
        innerApp(env, function (status, headers, body) {
          process.nextTick(function () {
            headers["X-Return-Type"] = typeof returnValue;
            callback(status, headers, body);
          });
        });
      };

      mock.call(app, env, this.callback);
    },
    "should return a boolean": function (err, status, headers, body) {
      assert.ok(headers["X-Return-Type"]);
      assert.equal(headers["X-Return-Type"], "boolean");
    },
    "should set a 500 status": function (err, status, headers, body) {
      assert.equal(status, 500);
    },
    "should write to env.error": function () {
      assert.ok(this.data);
      assert.match(this.data, /unhandled error/i);
    }
  },
  "A strata.Error": {
    topic: new strata.Error("Bang!"),
    "may be instantiated without using new": function () {
      assert.instanceOf(strata.Error(), strata.Error);
    },
    "is an instance of Error": function (err) {
      assert.instanceOf(err, Error);
    }
  }
}).export(module);
