var assert = require("assert"),
    vows = require("vows"),
    Stream = require("stream").Stream,
    BufferedStream = require("./../lib/bufferedstream");

vows.describe("stream").addBatch({
    "A BufferedStream": {
        topic: new BufferedStream,
        "should be empty": function (stream) {
            assert.ok(stream.empty);
        },
        "should be an instance of Stream": function (stream) {
            assert.instanceOf(stream, Stream);
        },
        "with string contents and no encoding": {
            topic: function () {
                var stream = new BufferedStream;
                var self = this;

                stream.on("data", function (chunk) {
                    self.callback(null, chunk);
                });

                stream.proxy("Hello world");
            },
            "should emit buffers": function (chunk) {
                assert.instanceOf(chunk, Buffer);
            }
        },
        "with string contents and an encoding": {
            topic: function () {
                var stream = new BufferedStream;
                var self = this;

                stream.setEncoding("base64");

                stream.on("data", function (chunk) {
                    self.callback(null, chunk);
                });

                stream.proxy("Hello world");
            },
            "should emit strings": function (chunk) {
                assert.equal(typeof chunk, "string");
            },
            "should use the proper encoding": function (chunk) {
                var expect = new Buffer("Hello world").toString("base64");
                assert.equal(chunk, expect);
            }
        },
        "when sourced from a string": {
            topic: function () {
                this.content = "Hello world";
                var source = this.content;
                bufferSource(source, this.callback);
            },
            "should emit that string's content": function (content) {
                assert.equal(content, this.content);
            },
            "and temporarily paused": {
                topic: function () {
                    this.content = "Hello world";
                    var source = this.content;
                    temporarilyPauseThenBufferSource(source, this.callback);
                },
                "should emit that string's content": function (content) {
                    assert.equal(content, this.content);
                }
            }
        },
        "when sourced from a Buffer": {
            topic: function () {
                this.content = "Hello world";
                var source = new Buffer(this.content);
                bufferSource(source, this.callback);
            },
            "should emit that buffer's content": function (content) {
                assert.equal(content, this.content);
            },
            "and temporarily paused": {
                topic: function () {
                    this.content = "Hello world";
                    var source = new Buffer(this.content);
                    temporarilyPauseThenBufferSource(source, this.callback);
                },
                "should emit that buffer's content": function (content) {
                    assert.equal(content, this.content);
                }
            }
        },
        "when sourced from another Stream": {
            topic: function () {
                this.content = "Hello world";
                var source = new BufferedStream;
                source.proxy(this.content);
                bufferSource(source, this.callback);
            },
            "should emit that stream's content": function (content) {
                assert.equal(content, this.content);
            },
            "and temporarily paused": {
                topic: function () {
                    this.content = "Hello world";
                    var source = new BufferedStream;
                    source.proxy(this.content);
                    temporarilyPauseThenBufferSource(source, this.callback);
                },
                "should emit that stream's content": function (content) {
                    assert.equal(content, this.content);
                }
            }
        }
    }
}).export(module);

function bufferSource(source, callback) {
    var stream = new BufferedStream;
    var content = "";

    stream.on("data", function (chunk) {
        assert.instanceOf(chunk, Buffer);
        content += chunk.toString();
    });

    stream.on("end", function () {
        callback(null, content);
    });

    stream.proxy(source);
}

function temporarilyPauseThenBufferSource(source, callback) {
    var stream = new BufferedStream;
    var content = "";

    stream.on("data", function (chunk) {
        assert.instanceOf(chunk, Buffer);
        content += chunk.toString();
    });

    stream.on("end", function () {
        callback(null, content);
    });

    stream.pause();
    stream.proxy(source);

    setTimeout(function () {
        stream.resume();
    }, 1);
}
