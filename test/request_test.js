var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/link/mock"),
    Request = require("./../lib/link/request");

vows.describe("request").addBatch({
    "A Request": {
        "with cookies": {
            topic: function () {
                var self = this;
                mock.request(null, {
                    headers: {
                        "Cookie": "a=1, a=2,b=3"
                    }
                }, function (env) {
                    var req = new Request(env);
                    req.cookies(self.callback);
                });
            },
            "should parse correctly": function (cookies) {
                assert.equal("1", cookies.a);
                assert.equal("3", cookies.b);
            }
        },
        "with a query": {
            topic: function () {
                var self = this;
                mock.request("/?a=1&a=2&b=3", null, function (env) {
                    var req = new Request(env);
                    req.query(self.callback);
                });
            },
            "should parse correctly": function (query) {
                assert.deepEqual(["1", "2"], query.a);
                assert.equal("3", query.b);
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
                }, function (env) {
                    var req = new Request(env);
                    req.body(self.callback);
                });
            },
            "should pass through unparsed": function (body) {
                assert.equal(this.body, body);
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
                }, function (env) {
                    var req = new Request(env);
                    req.body(self.callback);
                });
            },
            "should parse correctly": function (body) {
                assert.deepEqual(["1", "2"], body.a);
            }
        },
        "with a multipart/form-data body": {
            topic: function () {
                var body = '--AaB03x\r\n\
Content-Disposition: form-data; name="a"\r\n\
\r\n\
1\r\n\
--AaB03x\r\n\
Content-Disposition: form-data; name="b"\r\n\
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
                }, function (env) {
                    var req = new Request(env);
                    req.body(self.callback);
                });
            },
            "should parse correctly": function (body) {
                assert.equal("1", body.a);
                assert.equal("hello world", body.b);
            }
        }
    }
}).export(module);
