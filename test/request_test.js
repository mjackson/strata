var assert = require("assert"),
    vows = require("vows"),
    qs = require("querystring"),
    Request = require("./../lib/request"),
    mock = require("./../lib/mock"),
    BufferedStream = require("bufferedstream");

vows.describe("request").addBatch({
    "A Request": {
        topic: function () {
            this.protocol = "https:";
            this.protocolVersion = "1.1";
            this.requestMethod = "POST";
            this.serverName = "example.org";
            this.serverPort = "1234";
            this.pathInfo = "/some/path";
            this.queryString = "a=1&b=hello%20world";
            this.contentType = 'application/json; charset="utf-8"';
            this.contentLength = "0";
            this.userAgent = "test";
            this.referrer = "http://example.com/phony";
            this.headers = {
                "Content-Type": this.contentType,
                "Content-Length": this.contentLength,
                "User-Agent": this.userAgent,
                "Referer": this.referrer,
                "X-Requested-With": "XMLHttpRequest",
                "Accept": "text/html, */*",
                "Accept-Charset": "iso-8859-1, *",
                "Accept-Encoding": "gzip, *",
                "Accept-Language": "en"
            };

            var env = mock.env({
                protocol: this.protocol,
                protocolVersion: this.protocolVersion,
                requestMethod: this.requestMethod,
                serverName: this.serverName,
                serverPort: this.serverPort,
                pathInfo: this.pathInfo,
                queryString: this.queryString,
                headers: this.headers
            });

            var req = new Request(env);

            return req;
        },
        "should know its protocol": function (req) {
            assert.equal(req.protocol, this.protocol);
        },
        "should know its protocol version": function (req) {
            assert.equal(req.protocolVersion, this.protocolVersion);
        },
        "should know its method": function (req) {
            assert.equal(req.method, this.requestMethod);
        },
        "should know its script name": function (req) {
            assert.equal(req.scriptName, "");
        },
        "should be able to modify its script name": function (req) {
            var old = req.scriptName;
            req.scriptName = "/another/path";
            assert.equal(req.scriptName, "/another/path");
            req.scriptName = old;
            assert.equal(req.scriptName, old);
        },
        "should know its path info": function (req) {
            assert.equal(req.pathInfo, this.pathInfo);
        },
        "should be able to modify its path info": function (req) {
            var old = req.pathInfo;
            req.pathInfo = "/another/path";
            assert.equal(req.pathInfo, "/another/path");
            req.pathInfo = old;
            assert.equal(req.pathInfo, old);
        },
        "should know its query string": function (req) {
            assert.equal(req.queryString, this.queryString);
        },
        "should be able to modify its query string": function (req) {
            var old = req.queryString;
            req.queryString = "a=2";
            assert.equal(req.queryString, "a=2");
            req.queryString = old;
            assert.equal(req.queryString, old);
        },
        "should know its content type": function (req) {
            assert.equal(req.contentType, this.contentType);
        },
        "should know its content length": function (req) {
            assert.equal(req.contentLength, this.contentLength);
        },
        "should know its media type": function (req) {
            assert.equal(req.mediaType, "application/json");
        },
        "should know if it's parseable": function (req) {
            assert.ok(req.parseableData);
        },
        "should know its user agent": function (req) {
            assert.equal(req.userAgent, this.userAgent);
        },
        "should know its referrer": function (req) {
            assert.equal(req.referrer, this.referrer);
        },
        "should know what content types are acceptable": function (req) {
            assert.ok(req.accepts("text/html"));
            assert.ok(req.accepts("application/json"));
        },
        "should know what character sets are acceptable": function (req) {
            assert.ok(req.acceptsCharset("iso-8859-1"));
            assert.ok(req.acceptsCharset("utf-8"));
        },
        "should know what content encodings are acceptable": function (req) {
            assert.ok(req.acceptsEncoding("gzip"));
            assert.ok(req.acceptsEncoding("compress"));
        },
        "should know what languages are acceptable": function (req) {
            assert.ok(req.acceptsLanguage("en"));
            assert.ok(!req.acceptsLanguage("jp"));
        },
        "should know if it is secure": function (req) {
            assert.ok(req.ssl);
        },
        "should know if it was made via XMLHttpRequest": function (req) {
            assert.ok(req.xhr);
        },
        "should know its host and port": function (req) {
            assert.equal(req.hostWithPort, this.serverName + ":" + this.serverPort);
        },
        "should know its host": function (req) {
            assert.equal(req.host, this.serverName);
        },
        "should know its port": function (req) {
            assert.equal(req.port, this.serverPort);
        },
        "should know its base URL": function (req) {
            assert.equal(req.baseUrl, this.protocol + "//" + this.serverName + ":" + this.serverPort);
        },
        "should know its path": function (req) {
            assert.equal(req.path, this.pathInfo);
        },
        "should know its full path": function (req) {
            assert.equal(req.fullPath, this.pathInfo + "?" + this.queryString);
        },
        "should know its URL": function (req) {
            assert.equal(req.url, this.protocol + "//" + this.serverName + ":" + this.serverPort + this.pathInfo + "?" + this.queryString);
        },
        "behind a reverse HTTP proxy": {
            topic: function () {
                this.headers = {
                    "X-Forwarded-Ssl": "on",
                    "X-Forwarded-Host": this.serverName
                };

                var env = mock.env({headers: this.headers});
                var req = new Request(env);

                return req;
            },
            "should know its protocol": function (req) {
                assert.equal(req.protocol, this.protocol);
            },
            "should know its host": function (req) {
                assert.equal(req.host, this.serverName);
            },
            "should know its port": function (req) {
                assert.equal(req.port, "443");
            }
        },
        "with cookies": {
            topic: function () {
                this.cookie = "a=1, a=2,b=3";

                var self = this;
                mock.request({
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
                this.queryString = "a=1&a=2&b=3";

                var self = this;
                mock.request("/?" + this.queryString, function (env, callback) {
                    var req = new Request(env);
                    req.query(self.callback);
                });
            },
            "should parse it correctly": function (query) {
                assert.deepEqual(query, qs.parse(this.queryString));
            }
        },
        "with a text/plain body": {
            topic: function () {
                this.body = "This is some plain text.";

                var self = this;
                mock.request({
                    headers: {
                        "Content-Type": "text/plain",
                        "Content-Length": this.body.length.toString(10)
                    },
                    input: new BufferedStream(this.body)
                }, function (env, callback) {
                    var req = new Request(env);
                    req.body(self.callback);
                });
            },
            "should pass through unparsed": function (body) {
                assert.equal(body, this.body);
            }
        },
        "with an application/json body": {
            topic: function () {
                this.body = '{"a": 1, "b": 2}';

                var self = this;
                mock.request({
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Length": this.body.length.toString(10)
                    },
                    input: new BufferedStream(this.body)
                }, function (env, callback) {
                    var req = new Request(env);
                    req.body(self.callback);
                });
            },
            "should parse it correctly": function (body) {
                assert.deepEqual(body, JSON.parse(this.body));
            }
        },
        "with an application/x-www-form-urlencoded body": {
            topic: function () {
                this.body = "a=1&a=2";

                var self = this;
                mock.request({
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Content-Length": this.body.length.toString(10)
                    },
                    input: new BufferedStream(this.body)
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

                var self = this;
                mock.request({
                    headers: {
                        "Content-Type": 'multipart/form-data; boundary="AaB03x"',
                        "Content-Length": body.length.toString(10)
                    },
                    input: new BufferedStream(body)
                }, function (env, callback) {
                    var req = new Request(env);
                    req.body(self.callback);
                });
            },
            "should parse it correctly": function (body) {
                assert.equal(body.a, "hello world");
            }
        },
        "with a query string and a multipart/form-data body": {
            topic: function () {
                this.queryString = "a=1&a=2&b=3";

                var body = '--AaB03x\r\n\
Content-Disposition: form-data; name="a"\r\n\
\r\n\
hello world\r\n\
--AaB03x--\r';

                var self = this;
                mock.request({
                    queryString: this.queryString,
                    headers: {
                        "Content-Type": 'multipart/form-data; boundary="AaB03x"',
                        "Content-Length": body.length.toString(10)
                    },
                    input: new BufferedStream(body)
                }, function (env, callback) {
                    var req = new Request(env);
                    req.params(self.callback);
                });
            },
            "should parse all params correctly": function (params) {
                // The "a" parameter in the body should overwrite the value
                // of the parameter with the same name in the query string.
                assert.deepEqual(params, {a: "hello world", b: "3"});
            }
        }
    }
}).export(module);
