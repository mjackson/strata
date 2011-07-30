var assert = require("assert"),
    vows = require("vows"),
    EventEmitter = require("events").EventEmitter,
    link = require("./../lib/link"),
    mock = require("./../lib/link/mock");

vows.describe("link").addBatch({
    "envFor": {
        topic: function () {
            this.protocol = "https:";
            this.protocolVersion = "1.1";
            this.requestMethod = "POST";
            this.hostname = "example.org";
            this.port = "443";
            this.pathname = "/some/path";
            this.queryString = "a=1&b=2";
            this.userAgent = "test suite";
            this.content = "hello world!";
            this.contentLength = this.content.length.toString(10);

            var uri = {
                protocol: this.protocol,
                hostname: this.hostname,
                port: this.port,
                pathname: this.pathname,
                query: this.queryString
            };

            var input = new mock.Stream(this.content);
            input.pause();

            return link.envFor(uri, {
                protocolVersion: this.protocolVersion,
                method: this.requestMethod,
                headers: {
                    "Host": this.hostname,
                    "User-Agent": this.userAgent,
                    "Content-Length": this.contentLength
                },
                input: input
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
        "should have the correct serverName": function (env) {
            assert.equal(env.serverName, this.hostname);
        },
        "should have the correct serverPort": function (env) {
            assert.equal(env.serverPort, this.port);
        },
        "should have an empty scriptName": function (env) {
            assert.equal(env.scriptName, "");
        },
        "should have the correct pathInfo": function (env) {
            assert.equal(env.pathInfo, this.pathname);
        },
        "should have the correct queryString": function (env) {
            assert.equal(env.queryString, this.queryString);
        },
        "should have the correct headers": function (env) {
            assert.equal(env.httpHost, this.hostname);
            assert.equal(env.httpUserAgent, this.userAgent);
        },
        "should not have an httpContentLength property": function (env) {
            assert.isUndefined(env.httpContentLength);
        },
        "should have the correct contentLength": function (env) {
            assert.equal(env.contentLength, this.contentLength);
        },
        "version": {
            topic: function (env) {
                this.callback(null, env["link.version"]);
            },
            "should be the current version of Link": function (version) {
                assert.deepEqual(version, link.version);
            }
        },
        "input": {
            topic: function (env) {
                var input = env["link.input"],
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
                this.callback(null, env["link.error"]);
            },
            "should be a writable Stream": function (error) {
                assert.ok(error);
                assert.instanceOf(error, EventEmitter);
                assert.ok(error.writable);
            }
        }
    }
}).export(module);
