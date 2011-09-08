var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/mock"),
    sessionCookie = require("./../lib/session/cookie");

vows.describe("session_cookie").addBatch({
    "A sessionCookie middleware": {
        "should properly serialize and deserialize cookie data": function () {
            var sync = false;
            var app = sessionCookie(increment);

            mock.request("", app, function (status, headers, body) {
                assert.ok(headers["Set-Cookie"]);
                var match = headers["Set-Cookie"].match(/(strata\.session=[^;]+)/);
                assert.ok(match);
                assert.equal(body, '{"counter":1}');

                mock.request({
                    headers: {
                        "Cookie": match[1]
                    }
                }, app, function (status, headers, body) {
                    sync = true;
                    assert.ok(headers["Set-Cookie"]);
                    assert.equal(body, '{"counter":2}');
                });
            });

            assert.ok(sync);
        },
        "should reset the session when the cookie is tampered with": function () {
            var sync = false;
            var app = sessionCookie(increment);

            mock.request("", app, function (status, headers, body) {
                assert.ok(headers["Set-Cookie"]);
                var match = headers["Set-Cookie"].match(/(strata\.session=[^;]+)/);
                assert.ok(match);
                assert.equal(body, '{"counter":1}');

                // Tamper with the cookie.
                var cookie = match[1].substring(0, match[1].length - 2);

                mock.request({
                    headers: {
                        "Cookie": cookie
                    }
                }, app, function (status, headers, body) {
                    sync = true;
                    assert.ok(headers["Set-Cookie"]);
                    assert.equal(body, '{"counter":1}');
                });
            });

            assert.ok(sync);
        },
        "should drop content when the cookie size exceeds 4k": function () {
            var sync = false;
            var errors = "";
            var app = sessionCookie(toobig);

            mock.request({
                error: {
                    write: function (message) {
                        errors += message;
                    }
                }
            }, app, function (status, headers, body) {
                sync = true;
                assert.isUndefined(headers["Set-Cookie"]);
            });

            assert.match(errors, /content dropped/i);
            assert.ok(sync);
        }
    }
}).export(module);

function stringify(env, callback) {
    var content = JSON.stringify(env["strata.session"] || {});

    callback(200, {
        "Content-Type": "text/plain",
        "Content-Length": content.length.toString(10)
    }, content);
}

function increment(env, callback) {
    assert.ok(env["strata.session"]);

    if (!("counter" in env["strata.session"])) {
        env["strata.session"].counter = 0;
    }

    env["strata.session"].counter += 1;

    stringify(env, callback);
}

function toobig(env, callback) {
    assert.ok(env["strata.session"]);

    var value = "";

    for (var i = 0; i < 4096; ++i) {
        value += "a";
    }

    env["strata.session"].value = value;

    stringify(env, callback);
}
