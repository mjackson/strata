var assert = require("assert"),
    vows = require("vows"),
    qs = require("querystring"),
    Request = require("./../lib/link/request"),
    mock = require("./../lib/link/mock");

vows.describe("request").addBatch({
    "A Request": {
        "with cookies": {
            topic: function () {
                this.cookie = "a=1, a=2,b=3";

                var self = this;
                mock.request(null, {
                    headers: {
                        "Cookie": this.cookie
                    }
                }, function (env, callback) {
                    var req = new Request(env);
                    req.cookies(self.callback);
                });
            },
            "should parse them correctly": function (cookies) {
                assert.deepEqual(cookies, {a: "1", b: "3"});
            }
        },
        "with a query string": {
            topic: function () {
                this.query = "a=1&a=2&b=3";

                var self = this;
                mock.request("/?" + this.query, null, function (env, callback) {
                    var req = new Request(env);
                    req.query(self.callback);
                });
            },
            "should parse it correctly": function (query) {
                assert.deepEqual(query, qs.parse(this.query));
            }
        },
        "with a text/plain body": {
            topic: function () {
                this.body = "This is some plain text.";

                var input = new mock.Stream(this.body);
                input.pause();

                var self = this;
                mock.request(null, {
                    headers: {
                        "Content-Type": "text/plain",
                        "Content-Length": this.body.length.toString(10)
                    },
                    input: input
                }, function (env, callback) {
                    var req = new Request(env);
                    req.body(self.callback);
                });
            },
            "should pass through unparsed": function (body) {
                assert.equal(body, this.body);
            }
        },
        "with an application/x-www-form-urlencoded body": {
            topic: function () {
                this.body = "a=1&a=2";

                var input = new mock.Stream(this.body);
                input.pause();

                var self = this;
                mock.request(null, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Content-Length": this.body.length.toString(10)
                    },
                    input: input
                }, function (env, callback) {
                    var req = new Request(env);
                    req.body(self.callback);
                });
            },
            "should parse it correctly": function (body) {
                assert.deepEqual(body, qs.parse(this.body));
            }
        },
        "with a multipart/form-data body": {
            topic: function () {
                var body = '--AaB03x\r\n\
Content-Disposition: form-data; name="a"\r\n\
\r\n\
hello world\r\n\
--AaB03x--\r';

                var input = new mock.Stream(body);
                input.pause();

                var self = this;
                mock.request(null, {
                    headers: {
                        "Content-Type": 'multipart/form-data; boundary="AaB03x"',
                        "Content-Length": body.length.toString(10)
                    },
                    input: input
                }, function (env, callback) {
                    var req = new Request(env);
                    req.body(self.callback);
                });
            },
            "should parse it correctly": function (body) {
                assert.equal(body.a, "hello world");
            }
        },
        "with an application/json body": {
            topic: function () {
                this.body = '{"a": 1, "b": 2}';

                var input = new mock.Stream(this.body);
                input.pause();

                var self = this;
                mock.request(null, {
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Length": this.body.length.toString(10)
                    },
                    input: input
                }, function (env, callback) {
                    var req = new Request(env);
                    req.body(self.callback);
                });
            },
            "should parse it correctly": function (body) {
                assert.deepEqual(body, JSON.parse(this.body));
            }
        }
    }
}).export(module);
