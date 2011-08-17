var assert = require("assert"),
    vows = require("vows"),
    Input = require("./../lib/input"),
    mock = require("./../lib/mock");

vows.describe("input").addBatch({
    "An Input": {
        "with no encoding set": {
            topic: function () {
                this.content = "hello world!";

                var stream = new mock.Stream(this.content),
                    input = new Input(stream),
                    content = "",
                    self = this;

                input.on("data", function (buffer) {
                    assert.ok(buffer instanceof Buffer);
                    content += buffer.toString("utf8");
                });

                input.on("end", function () {
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
                    input = new Input(stream),
                    content = "",
                    self = this;

                input.setEncoding("utf8");

                input.on("data", function (chunk) {
                    assert.ok(typeof chunk == "string");
                    content += chunk;
                });

                input.on("end", function () {
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
                    input = new Input(stream),
                    content = "",
                    self = this;

                input.pause();

                input.on("data", function (buffer) {
                    assert.ok(buffer instanceof Buffer);
                    content += buffer.toString("utf8");
                });

                input.on("end", function () {
                    self.callback(null, content);
                });

                setTimeout(function () {
                    input.resume();
                }, 10);
            },
            "should emit its contents when resumed": function (content) {
                assert.equal(content, this.content);
            }
        }
    }
}).export(module);
