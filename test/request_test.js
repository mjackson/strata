var assert = require("assert"),
    vows = require("vows"),
    qs = require("querystring"),
    Request = require("./../lib/link/request"),
    mock = require("./../lib/link/mock");

vows.describe("request").addBatch({
    "A Request": {
        topic: function () {
            this.protocol = "https:";
            this.hostname = "example.org";
            this.pathname = "/some/path";
            this.query = "a=1&b=hello%20world";
            this.protocolVersion = "1.1";
            this.method = "POST";
            this.contentType = 'text/html; charset="utf-8"';
            this.contentLength = "0";
            this.userAgent = "test";
            this.headers = {
                "Content-Type": this.contentType,
                "Content-Length": this.contentLength,
                "User-Agent": this.userAgent,
                "X-Requested-With": "XMLHttpRequest"
            };

            var env = mock.env({
                protocol: this.protocol,
                hostname: this.hostname,
                pathname: this.pathname,
                query: this.query
            }, {
                protocolVersion: this.protocolVersion,
                method: this.method,
                headers: this.headers
            });

            var req = new Request(env);

            this.callback(null, req);
        },
        "should know its protocol": function (req) {
            assert.equal(req.protocol, this.protocol);
        },
        "should know its protocol version": function (req) {
            assert.equal(req.protocolVersion, this.protocolVersion);
        },
        "should know its method": function (req) {
            assert.equal(req.method, this.method);
        },
        "should know its script name": function (req) {
            assert.equal(req.scriptName, "");
        },
        "should be able to modify its script name": function (req) {
            req.scriptName = "/another/path";
            assert.equal(req.scriptName, "/another/path");
        },
        "should know its path info": function (req) {
            assert.equal(req.pathInfo, this.pathname);
        },
        "should be able to modify its path info": function (req) {
            req.pathInfo = "/another/path";
            assert.equal(req.pathInfo, "/another/path");
        },
        "should know its query string": function (req) {
            assert.equal(req.queryString, this.query);
        },
        "should be able to modify its query string": function (req) {
            req.queryString = "a=2";
            assert.equal(req.queryString, "a=2");
        },
        "should know its content type": function (req) {
            assert.equal(req.contentType, this.contentType);
        },
        "should know its content length": function (req) {
            assert.equal(req.contentLength, this.contentLength);
        },
        "should know its media type": function (req) {
            assert.equal(req.mediaType, "text/html");
        },
        "should know its user agent": function (req) {
            assert.equal(req.userAgent, this.userAgent);
        },
        "should know if it is secure": function (req) {
            assert.ok(req.ssl);
        },
        "should know if it was made via XMLHttpRequest": function (req) {
            assert.ok(req.xhr);
        },
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
