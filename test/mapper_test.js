var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/mock"),
    Mapper = require("./../lib/mapper");

vows.describe("mapper").addBatch({
    "A Mapper": {
        "should dispatch paths correctly": function (map) {
            var app = function (env, callback) {
                callback(200, {
                    "X-ScriptName": env.scriptName,
                    "X-PathInfo": env.pathInfo,
                    "Content-Type": "text/plain"
                }, "");
            }

            var map = Mapper.fromMap({
                "http://example.org/static": app,
                "/path": app,
                "/some/path": app
            });

            mock.request("/", map, function (status, headers, body) {
                assert.equal(status, 404);
            });

            mock.request("/foo", map, function (status, headers, body) {
                assert.equal(status, 404);
            });

            mock.request("/path", map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-ScriptName"], "/path");
                assert.equal(headers["X-PathInfo"], "");
            });

            mock.request("/path/", map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-ScriptName"], "/path");
                assert.equal(headers["X-PathInfo"], "/");
            });

            mock.request("/some/path", map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-ScriptName"], "/some/path");
                assert.equal(headers["X-PathInfo"], "");
            });

            mock.request("/some/path/", map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-ScriptName"], "/some/path");
                assert.equal(headers["X-PathInfo"], "/");
            });

            mock.request("/some///path//name", map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-ScriptName"], "/some/path");
                assert.equal(headers["X-PathInfo"], "//name");
            });

            mock.request({
                scriptName: "/elsewhere",
                pathInfo: "/path/name"
            }, map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-ScriptName"], "/elsewhere/path");
                assert.equal(headers["X-PathInfo"], "/name");
            });

            mock.request({
                pathInfo: "/static",
                headers: {
                    "Host": "example.org"
                }
            }, map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-ScriptName"], "/static");
                assert.equal(headers["X-PathInfo"], "");
            });

            mock.request({
                pathInfo: "/static/",
                headers: {
                    "Host": "example.org"
                }
            }, map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-ScriptName"], "/static");
                assert.equal(headers["X-PathInfo"], "/");
            });
        },
        "should dispatch hosts correctly": function () {
            var map = Mapper.fromMap({
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

            mock.request("/", map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-Position"], "example.com");
            });

            mock.request({
                pathInfo: "/",
                headers: {
                    "Host": "example.org"
                }
            }, map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-Position"], "example.org");
            });

            mock.request({
                pathInfo: "/",
                headers: {
                    "Host": "example.net"
                }
            }, map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-Position"], "example.net");
            });

            mock.request({
                serverName: "example.org",
                pathInfo: "/",
                headers: {
                    "Host": "subdomain.example.org"
                }
            }, map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-Position"], "subdomain.example.org");
            });

            mock.request("http://example.org/", map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-Position"], "example.org");
            });

            mock.request({
                serverName: "example.info",
                pathInfo: "/",
                headers: {
                    "Host": "example.info"
                }
            }, map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-Position"], "example.com");
            });

            mock.request({
                serverName: "example.info",
                serverPort: "9292",
                pathInfo: "/",
                headers: {
                    "Host": "example.info:9292"
                }
            }, map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-Position"], "example.com");
            });
        },
        "should be nestable": function () {
            var map = Mapper.fromMap({
                "/some": Mapper.fromMap({
                    "/path": Mapper.fromMap({
                        "/name": function (env, callback) {
                            callback(200, {
                                "Content-Type": "text/plain",
                                "X-Position": "/some/path/name",
                                "X-ScriptName": env.scriptName,
                                "X-PathInfo": env.pathInfo
                            }, "");
                        }
                    }).toApp()
                }).toApp()
            });

            mock.request("/some/path", map, function (status, headers, body) {
                assert.equal(status, 404);
            });

            mock.request("/some/path/name", map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-Position"], "/some/path/name");
                assert.equal(headers["X-ScriptName"], "/some/path/name");
                assert.equal(headers["X-PathInfo"], "");
            });
        },
        "should route root apps correctly": function () {
            var map = Mapper.fromMap({
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

            mock.request("/path", map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-Position"], "path");
                assert.equal(headers["X-ScriptName"], "/path");
                assert.equal(headers["X-PathInfo"], "");
            });

            mock.request("/path/name", map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-Position"], "path");
                assert.equal(headers["X-ScriptName"], "/path");
                assert.equal(headers["X-PathInfo"], "/name");
            });

            mock.request("", map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-Position"], "root");
                assert.equal(headers["X-ScriptName"], "");
                assert.equal(headers["X-PathInfo"], "/");
            });

            mock.request("/name", map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-Position"], "root");
                assert.equal(headers["X-ScriptName"], "");
                assert.equal(headers["X-PathInfo"], "/name");
            });
        },
        "should not squeeze slashes": function () {
            var map = Mapper.fromMap({
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

            mock.request("/http://example.org/another", map, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-Position"], "root");
                assert.equal(headers["X-ScriptName"], "");
                assert.equal(headers["X-PathInfo"], "/http://example.org/another");
            });
        }
    }
}).export(module);
