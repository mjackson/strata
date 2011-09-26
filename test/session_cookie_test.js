var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/mock"),
    sessionCookie = require("./../lib/session/cookie");

vows.describe("session/cookie").addBatch({
    "A sessionCookie middleware": {
        "should properly serialize and deserialize cookie data": function () {
            var sync = false;
            var app = sessionCookie(increment);

            mock.request("", app, function (err, status, headers, body) {
                assert.ok(headers["Set-Cookie"]);
                var match = headers["Set-Cookie"].match(/(strata\.session=[^;]+)/);
                assert.ok(match);
                assert.equal(body, '{"counter":1}');

                mock.request({
                    headers: {
                        "Cookie": match[1]
                    }
                }, app, function (err, status, headers, body) {
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

            mock.request("", app, function (err, status, headers, body) {
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
                }, app, function (err, status, headers, body) {
                    sync = true;
                    assert.ok(headers["Set-Cookie"]);
                    assert.equal(body, '{"counter":1}');
                });
            });

            assert.ok(sync);
        },
        "when the cookie size exceeds 4k": {
            topic: function () {
                var app = sessionCookie(toobig);

                mock.request({
                    error: mock.stream(this),
                }, app, this.callback);
            },
            "should not set the cookie": function (err, status, headers, body) {
                assert.isUndefined(headers["Set-Cookie"]);
            },
            "should drop content": function (err, status, headers, body) {
                assert.match(this.data, /content dropped/i);
            }
        }
    }
}).export(module);

function stringify(env, callback) {
    var content = JSON.stringify(env.session || {});

    callback(200, {
        "Content-Type": "text/plain",
        "Content-Length": content.length.toString(10)
    }, content);
}

function increment(env, callback) {
    assert.ok(env.session);

    if (!("counter" in env.session)) {
        env.session.counter = 0;
    }

    env.session.counter += 1;

    stringify(env, callback);
}

function toobig(env, callback) {
    assert.ok(env.session);

    var value = "";

    for (var i = 0; i < 4096; ++i) {
        value += "a";
    }

    env.session.value = value;

    stringify(env, callback);
}
