var assert = require("assert"),
    vows = require("vows"),
    EventEmitter = require("events").EventEmitter,
    link = require("./../lib/link"),
    mock = require("./../lib/link/mock");

vows.describe("link").addBatch({
    "env": {
        topic: function () {
            this.protocol = "https:";
            this.protocolVersion = "1.1";
            this.requestMethod = "POST";
            this.serverName = "example.org";
            this.serverPort = "443";
            this.pathInfo = "/some/path";
            this.queryString = "a=1&b=2";
            this.userAgent = "test suite";
            this.content = "hello world!";
            this.contentLength = this.content.length.toString(10);

            var input = new mock.Stream(this.content);
            input.pause();

            return link.env({
                protocol: this.protocol,
                protocolVersion: this.protocolVersion,
                requestMethod: this.requestMethod,
                serverName: this.serverName,
                serverPort: this.serverPort,
                pathInfo: this.pathInfo,
                queryString: this.queryString,
                headers: {
                    "Host": this.serverName,
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
            assert.equal(env.serverName, this.serverName);
        },
        "should have the correct serverPort": function (env) {
            assert.equal(env.serverPort, this.serverPort);
        },
        "should have an empty scriptName": function (env) {
            assert.equal(env.scriptName, "");
        },
        "should have the correct pathInfo": function (env) {
            assert.equal(env.pathInfo, this.pathInfo);
        },
        "should have the correct queryString": function (env) {
            assert.equal(env.queryString, this.queryString);
        },
        "should have the correct headers": function (env) {
            assert.equal(env.httpHost, this.serverName);
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
    },
    "Error": {
        topic: new link.Error("Bang!"),
        "should be an instance of Error": function (err) {
            assert.instanceOf(err, Error);
        }
    }
}).export(module);
