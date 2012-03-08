var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/mock"),
    lint = require("./../lib/lint"),
    utils = require("./../lib/utils");

vows.describe("lint").addBatch({
    "A lint middleware": {
        "should detect an invalid caller": function () {
            var app = lint(utils.empty);
            assert.throws(function () {
                app(); // Call the downstream app with no arguments.
            }, /two arguments/);
        },
        "should detect an invalid callee": function () {
            var app = lint(function (env, callback) {
                callback(); // Call the upstream caller with no arguments.
            });
            assert.throws(function () {
                app(mock.env(), function (status, headers, body) {});
            }, /three arguments/);
        },
        "should detect an invalid environment": function () {
            var app = lint(utils.empty);

            assert.throws(function () {
                app("", function (status, headers, body) {});
            }, /must be an object/);

            var requiredProperties = [
                "protocol",
                "protocolVersion",
                "requestMethod",
                "remoteAddr",
                "remotePort",
                "serverName",
                "serverPort",
                "scriptName",
                "pathInfo",
                "queryString"
            ];

            requiredProperties.forEach(function (p) {
                assertRequiredProperty(p);
                assertStringProperty(p);
            });

            assertRequiredProperty("requestTime");

            assert.throws(function () {
                var env = mock.env();
                env.httpContentType = "text/plain";
                app(env, function (status, headers, body) {});
            }, /must not contain property "httpContentType"/);

            assert.throws(function () {
                var env = mock.env();
                env.httpContentLength = "0";
                app(env, function (status, headers, body) {});
            }, /must not contain property "httpContentLength"/);

            var requiredStrataProperties = [
                "strataVersion",
                "input",
                "error"
            ];

            requiredStrataProperties.forEach(function (p) {
                assertRequiredProperty(p);
            });

            assert.throws(function () {
                var env = mock.env({protocol: "ftp:"});
                app(env, function (status, headers, body) {});
            }, /protocol must be/);

            assert.throws(function () {
                var env = mock.env({requestMethod: "123"});
                app(env, function (status, headers, body) {});
            }, /method must be/);

            assert.throws(function () {
                var env = mock.env({scriptName: "some/path"});
                app(env, function (status, headers, body) {});
            }, /scriptName must start with "\/"/);

            assert.throws(function () {
                var env = mock.env({scriptName: "/"});
                app(env, function (status, headers, body) {});
            }, /scriptName must not be "\/"/);

            assert.throws(function () {
                var env = mock.env({pathInfo: "some/path"});
                app(env, function (status, headers, body) {});
            }, /pathInfo must start with "\/"/);

            assert.throws(function () {
                var env = mock.env();
                env.strataVersion = "1.0";
                app(env, function (status, headers, body) {});
            }, /strataVersion must be an array/);

            assert.throws(function () {
                var env = mock.env();
                env.input = "";
                app(env, function (status, headers, body) {});
            }, /input must be a Stream/);

            assert.throws(function () {
                var env = mock.env();
                env.error = "";
                app(env, function (status, headers, body) {});
            }, /error must be a Stream/);
        },
        "should detect an invalid callback": function () {
            var app = lint(utils.empty);

            assert.throws(function () {
                app(mock.env(), "");
            }, /must be a function/);

            assert.throws(function () {
                app(mock.env(), function () {});
            }, /three arguments/);
        },
        "should detect an invalid status code": function () {
            var app = lint(function (env, callback) {
                callback("200", {}, "");
            });

            assert.throws(function () {
                app(mock.env(), function (status, headers, body) {});
            }, /must be a number/);

            app = lint(function (env, callback) {
                callback(0, {}, "");
            });

            assert.throws(function () {
                app(mock.env(), function (status, headers, body) {});
            }, /must be a valid HTTP status code/);
        },
        "should detect invalid headers": function () {
            var app = lint(function (env, callback) {
                callback(200, "", "");
            });

            assert.throws(function () {
                app(mock.env(), function (status, headers, body) {});
            }, /must be an object/);

            app = lint(function (env, callback) {
                callback(200, {"Content-Type": 123}, "");
            });

            assert.throws(function () {
                app(mock.env(), function (status, headers, body) {});
            }, /must be a string/);

            app = lint(function (env, callback) {
                callback(200, {"1Header": ""}, "");
            });

            assert.throws(function () {
                app(mock.env(), function (status, headers, body) {});
            }, /must start with a letter/);
        },
        "should detect an invalid body": function () {
            var app = lint(function (env, callback) {
                callback(200, {}, 123);
            });

            assert.throws(function () {
                app(mock.env(), function (status, headers, body) {});
            }, /must be a string/);
        },
        "should detect an invalid Content-Type": function () {
            var app = lint(function (env, callback) {
                callback(200, {}, "");
            });

            assert.throws(function () {
                app(mock.env(), function (status, headers, body) {});
            }, /missing content-type/i);

            app = lint(function (env, callback) {
                callback(204, {"Content-Type": "text/plain"}, "");
            });

            assert.throws(function () {
                app(mock.env(), function (status, headers, body) {});
            }, /content-type header given/i);
        },
        "should detect an invalid Content-Length": function () {
            var app = lint(function (env, callback) {
                callback(204, {"Content-Length": "0"}, "");
            });

            assert.doesNotThrow(function () {
                app(mock.env(), function (status, headers, body) {});
            });

            app = lint(function (env, callback) {
                callback(204, {"Content-Length": "1"}, "a");
            });

            assert.throws(function () {
                app(mock.env(), function (status, headers, body) {});
            }, /non-zero content-length/i);
        }
    }
}).export(module);

function assertRequiredProperty(property) {
    var app = lint(utils.empty);
    var matcher = new RegExp('missing required property "' + property + '"');
    assert.throws(function () {
        var env = mock.env();
        delete env[property];
        app(env, function (status, headers, body) {});
    }, matcher);
}

function assertStringProperty(property) {
    var app = lint(utils.empty);
    var matcher = new RegExp('"' + property + '" must be a string');
    assert.throws(function () {
        var env = mock.env();
        env[property] = 1;
        app(env, function (status, headers, body) {});
    }, matcher);
}
