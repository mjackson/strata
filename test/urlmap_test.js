var assert = require("assert");
var vows = require("vows");
var mock = require("./../lib/mock");
var urlMap = require("./../lib/urlmap");
var utils = require("./../lib/utils");

vows.describe("urlMap").addBatch({
  "A urlMap middleware": {
    topic: function () {
      var app = urlMap();
      mock.request("", app, this.callback);
    },
    "should return 404 by default": function (err, status, headers, body) {
      assert.equal(status, 404);
    },
    "with path-based definitions": {
      topic: function () {
        var app = function (env, callback) {
          callback(200, {
            "X-ScriptName": env.scriptName,
            "X-PathInfo": env.pathInfo,
            "Content-Type": "text/plain"
          }, "");
        };

        return makeMap({
          "http://example.org/static": app,
          "/path": app,
          "/some/path": app
        });
      },
      "when / is requested": {
        topic: function (app) {
          mock.request("/", app, this.callback);
        },
        "should return 404": function (err, status, headers, body) {
          assert.equal(status, 404);
        }
      },
      "when /foo is requested": {
        topic: function (app) {
          mock.request("/foo", app, this.callback);
        },
        "should return 404": function (err, status, headers, body) {
          assert.equal(status, 404);
        }
      },
      "when /path is requested": {
        topic: function (app) {
          mock.request("/path", app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should have the proper scriptName": function (err, status, headers, body) {
          assert.equal(headers["X-ScriptName"], "/path");
        },
        "should have the proper pathInfo": function (err, status, headers, body) {
          assert.equal(headers["X-PathInfo"], "");
        }
      },
      "when /path/ is requested": {
        topic: function (app) {
          mock.request("/path/", app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should have the proper scriptName": function (err, status, headers, body) {
          assert.equal(headers["X-ScriptName"], "/path");
        },
        "should have the proper pathInfo": function (err, status, headers, body) {
          assert.equal(headers["X-PathInfo"], "/");
        }
      },
      "when /some/path is requested": {
        topic: function (app) {
          mock.request("/some/path", app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should have the proper scriptName": function (err, status, headers, body) {
          assert.equal(headers["X-ScriptName"], "/some/path");
        },
        "should have the proper pathInfo": function (err, status, headers, body) {
          assert.equal(headers["X-PathInfo"], "");
        }
      },
      "when /some/path/ is requested": {
        topic: function (app) {
          mock.request("/some/path/", app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should have the proper scriptName": function (err, status, headers, body) {
          assert.equal(headers["X-ScriptName"], "/some/path");
        },
        "should have the proper pathInfo": function (err, status, headers, body) {
          assert.equal(headers["X-PathInfo"], "/");
        }
      },
      "when /some///path//name is requested": {
        topic: function (app) {
          mock.request("/some///path//name", app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should have the proper scriptName": function (err, status, headers, body) {
          assert.equal(headers["X-ScriptName"], "/some/path");
        },
        "should have the proper pathInfo": function (err, status, headers, body) {
          assert.equal(headers["X-PathInfo"], "//name");
        }
      },
      "when scriptName is /elsewhere and pathInfo is /path/name": {
        topic: function (app) {
          mock.request({
            scriptName: "/elsewhere",
            pathInfo: "/path/name"
          }, app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should have the proper scriptName": function (err, status, headers, body) {
          assert.equal(headers["X-ScriptName"], "/elsewhere/path");
        },
        "should have the proper pathInfo": function (err, status, headers, body) {
          assert.equal(headers["X-PathInfo"], "/name");
        }
      },
      "when pathInfo is /static and httpHost is example.org": {
        topic: function (app) {
          mock.request({
            pathInfo: "/static",
            headers: {
              "Host": "example.org"
            }
          }, app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should have the proper scriptName": function (err, status, headers, body) {
          assert.equal(headers["X-ScriptName"], "/static");
        },
        "should have the proper pathInfo": function (err, status, headers, body) {
          assert.equal(headers["X-PathInfo"], "");
        }
      },
      "when pathInfo is /static/ and httpHost is example.org": {
        topic: function (app) {
          mock.request({
            pathInfo: "/static/",
            headers: {
              "Host": "example.org"
            }
          }, app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should have the proper scriptName": function (err, status, headers, body) {
          assert.equal(headers["X-ScriptName"], "/static");
        },
        "should have the proper pathInfo": function (err, status, headers, body) {
          assert.equal(headers["X-PathInfo"], "/");
        }
      }
    },
    "with host-based definitions": {
      topic: function () {
        return makeMap({
          "/": function (env, callback) {
            callback(200, {
              "Content-Type": "text/plain",
              "X-Position": "example.com",
              "X-Host": env.httpHost || env.serverName
            }, "");
          },
          "http://example.org/": function (env, callback) {
            callback(200, {
              "Content-Type": "text/plain",
              "X-Position": "example.org",
              "X-Host": env.httpHost || env.serverName
            }, "");
          },
          "http://subdomain.example.org/": function (env, callback) {
            callback(200, {
              "Content-Type": "text/plain",
              "X-Position": "subdomain.example.org",
              "X-Host": env.httpHost || env.serverName
            }, "");
          },
          "http://example.net/": function (env, callback) {
            callback(200, {
              "Content-Type": "text/plain",
              "X-Position": "example.net",
              "X-Host": env.httpHost || env.serverName
            }, "");
          }
        });
      },
      "when / is requested": {
        topic: function (app) {
          mock.request("/", app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should call the correct app": function (err, status, headers, body) {
          assert.equal(headers["X-Position"], "example.com");
        }
      },
      "when pathInfo is / and httpHost is example.org": {
        topic: function (app) {
          mock.request({
            pathInfo: "/",
            headers: {
              "Host": "example.org"
            }
          }, app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should call the correct app": function (err, status, headers, body) {
          assert.equal(headers["X-Position"], "example.org");
        }
      },
      "when pathInfo is / and httpHost is example.org": {
        topic: function (app) {
          mock.request({
            pathInfo: "/",
            headers: {
              "Host": "example.net"
            }
          }, app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should call the correct app": function (err, status, headers, body) {
          assert.equal(headers["X-Position"], "example.net");
        }
      },
      "when serverName is example.org, pathInfo is /, and httpHost is subdomain.example.org": {
        topic: function (app) {
          mock.request({
            serverName: "example.org",
            pathInfo: "/",
            headers: {
              "Host": "subdomain.example.org"
            }
          }, app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should call the correct app": function (err, status, headers, body) {
          assert.equal(headers["X-Position"], "subdomain.example.org");
        }
      },
      "when http://example.org/ is requested": {
        topic: function (app) {
          mock.request("http://example.org/", app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should call the correct app": function (err, status, headers, body) {
          assert.equal(headers["X-Position"], "example.org");
        }
      },
      "when serverName is example.info, pathInfo is /, and httpHost is example.info": {
        topic: function (app) {
          mock.request({
            serverName: "example.info",
            pathInfo: "/",
            headers: {
              "Host": "example.info"
            }
          }, app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should call the correct app": function (err, status, headers, body) {
          assert.equal(headers["X-Position"], "example.com");
        }
      },
      "when serverName is example.info, serverPort is 9292, pathInfo is /, and httpHost is example.info:9292": {
        topic: function (app) {
          mock.request({
            serverName: "example.info",
            serverPort: "9292",
            pathInfo: "/",
            headers: {
              "Host": "example.info:9292"
            }
          }, app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should call the correct app": function (err, status, headers, body) {
          assert.equal(headers["X-Position"], "example.com");
        }
      }
    },
    "with nested Mappers": {
      topic: function () {
        return makeMap({
          "/some": makeMap({
            "/path": makeMap({
              "/name": function (env, callback) {
                callback(200, {
                  "Content-Type": "text/plain",
                  "X-Position": "/some/path/name",
                  "X-ScriptName": env.scriptName,
                  "X-PathInfo": env.pathInfo
                }, "");
              }
            })
          })
        });
      },
      "when /some/path is requested": {
        topic: function (app) {
          mock.request("/some/path", app, this.callback);
        },
        "should return 404": function (err, status, headers, body) {
          assert.equal(status, 404);
        }
      },
      "when /some/path/name is requested": {
        topic: function (app) {
          mock.request("/some/path/name", app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should call the correct app": function (err, status, headers, body) {
          assert.equal(headers["X-Position"], "/some/path/name");
        },
        "should have the proper scriptName": function (err, status, headers, body) {
          assert.equal(headers["X-ScriptName"], "/some/path/name");
        },
        "should have the proper pathInfo": function (err, status, headers, body) {
          assert.equal(headers["X-PathInfo"], "");
        }
      }
    },
    "with multiple root apps": {
      topic: function () {
        return makeMap({
          "/": function (env, callback) {
            callback(200, {
              "Content-Type": "text/plain",
              "X-Position": "root",
              "X-ScriptName": env.scriptName,
              "X-PathInfo": env.pathInfo
            }, "");
          },
          "/path": function (env, callback) {
            callback(200, {
              "Content-Type": "text/plain",
              "X-Position": "path",
              "X-ScriptName": env.scriptName,
              "X-PathInfo": env.pathInfo
            }, "");
          }
        });
      },
      "when /path is requested": {
        topic: function (app) {
          mock.request("/path", app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should call the correct app": function (err, status, headers, body) {
          assert.equal(headers["X-Position"], "path");
        },
        "should have the proper scriptName": function (err, status, headers, body) {
          assert.equal(headers["X-ScriptName"], "/path");
        },
        "should have the proper pathInfo": function (err, status, headers, body) {
          assert.equal(headers["X-PathInfo"], "");
        }
      },
      "when /path/name is requested": {
        topic: function (app) {
          mock.request("/path/name", app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should call the correct app": function (err, status, headers, body) {
          assert.equal(headers["X-Position"], "path");
        },
        "should have the proper scriptName": function (err, status, headers, body) {
          assert.equal(headers["X-ScriptName"], "/path");
        },
        "should have the proper pathInfo": function (err, status, headers, body) {
          assert.equal(headers["X-PathInfo"], "/name");
        }
      },
      "when / is requested": {
        topic: function (app) {
          mock.request("/", app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should call the correct app": function (err, status, headers, body) {
          assert.equal(headers["X-Position"], "root");
        },
        "should have the proper scriptName": function (err, status, headers, body) {
          assert.equal(headers["X-ScriptName"], "");
        },
        "should have the proper pathInfo": function (err, status, headers, body) {
          assert.equal(headers["X-PathInfo"], "/");
        }
      },
      "when /name is requested": {
        topic: function (app) {
          mock.request("/name", app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should call the correct app": function (err, status, headers, body) {
          assert.equal(headers["X-Position"], "root");
        },
        "should have the proper scriptName": function (err, status, headers, body) {
          assert.equal(headers["X-ScriptName"], "");
        },
        "should have the proper pathInfo": function (err, status, headers, body) {
          assert.equal(headers["X-PathInfo"], "/name");
        }
      },
      "when /http://example.org/another is requested": {
        topic: function (app) {
          mock.request("/http://example.org/another", app, this.callback);
        },
        "should return 200": function (err, status, headers, body) {
          assert.equal(status, 200);
        },
        "should call the correct app": function (err, status, headers, body) {
          assert.equal(headers["X-Position"], "root");
        },
        "should not squeeze slashes": function (err, status, headers, body) {
          assert.equal(headers["X-ScriptName"], "");
          assert.equal(headers["X-PathInfo"], "/http://example.org/another");
        }
      }
    }
  }
}).export(module);

// Creates a new urlMap from the location/app pairs in `locationsMap`.
function makeMap(locationsMap) {
  var map = urlMap();

  for (var location in locationsMap) {
    map.map(location, locationsMap[location]);
  }

  return map;
}
