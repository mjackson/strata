var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/mock"),
    utils = require("./../lib/utils");

vows.describe("mock").addBatch({
    "A mock Stream": {
        "with no encoding set": {
            topic: function () {
                this.content = "hello world!";

                var stream = new mock.Stream(this.content),
                    content = "",
                    self = this;

                stream.on("data", function (buffer) {
                    assert.ok(buffer instanceof Buffer);
                    content += buffer.toString("utf8");
                });

                stream.on("end", function () {
                    self.callback(null, content);
                });
            },
            "should emit its contents as buffers": function (content) {
                assert.equal(content, this.content);
            }
        },
        "with an encoding set": {
            topic: function () {
                this.content = "hello world!";

                var stream = new mock.Stream(this.content),
                    content = "",
                    self = this;

                stream.setEncoding("utf8");

                stream.on("data", function (chunk) {
                    assert.ok(typeof chunk == "string");
                    content += chunk;
                });

                stream.on("end", function () {
                    self.callback(null, content);
                });
            },
            "should emit its contents as strings": function (content) {
                assert.equal(content, this.content);
            }
        },
        "that is paused": {
            topic: function () {
                this.content = "hello world!";

                var stream = new mock.Stream(this.content),
                    content = "",
                    self = this;

                stream.pause();

                stream.on("data", function (buffer) {
                    assert.ok(buffer instanceof Buffer);
                    content += buffer.toString("utf8");
                });

                stream.on("end", function () {
                    self.callback(null, content);
                });

                setTimeout(function () {
                    stream.resume();
                }, 10);
            },
            "should emit its contents when resumed": function (content) {
                assert.equal(content, this.content);
            }
        }
    },
    "A mock request to utils.empty": {
        topic: function () {
            mock.request(null, utils.empty, this.callback);
        },
        "should return a correct status code": function (err, status, headers, body) {
            assert.equal(status, utils.empty.status);
        },
        "should return the correct headers": function (err, status, headers, body) {
            assert.deepEqual(headers, utils.empty.headers);
        },
        "should return an empty body": function (err, status, headers, body) {
            assert.equal(body, utils.empty.body);
        }
    }
}).export(module);
