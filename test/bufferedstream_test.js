var assert = require("assert"),
    vows = require("vows"),
    Stream = require("stream").Stream,
    BufferedStream = require("./../lib/bufferedstream");

vows.describe("stream").addBatch({
    "A BufferedStream": {
        topic: new BufferedStream,
        "should be an instance of Stream": function (stream) {
            assert.instanceOf(stream, Stream);
        },
        "should be empty": function (stream) {
            assert.ok(stream.empty);
        },
        "should not be full": function (stream) {
            assert.ok(!stream.full);
        },
        "should be readable": function (stream) {
            assert.ok(stream.readable);
        },
        "should be writable": function (stream) {
            assert.ok(stream.writable);
        },
        "should not be ended": function (stream) {
            assert.ok(!stream.ended);
        },
        "after end() has been called": {
            topic: function () {
                var stream = new BufferedStream;
                stream.end();
                return stream;
            },
            "should be ended": function (stream) {
                assert.ok(stream.ended);
            },
            "should throw an error when written to": function (stream) {
                assert.throws(function () {
                    stream.write("hello");
                }, /not writable/);
            }
        },
        "with string contents and no encoding": {
            topic: function () {
                var stream = new BufferedStream("hello");
                var self = this;

                stream.on("data", function (chunk) {
                    self.callback(null, chunk);
                });
            },
            "should emit buffers": function (chunk) {
                assert.instanceOf(chunk, Buffer);
            }
        },
        "with string contents and an encoding": {
            topic: function () {
                var stream = new BufferedStream("hello");
                var self = this;

                stream.setEncoding("base64");

                stream.on("data", function (chunk) {
                    self.callback(null, chunk);
                });
            },
            "should emit strings": function (chunk) {
                assert.equal(typeof chunk, "string");
            },
            "should use the proper encoding": function (chunk) {
                var expect = new Buffer("hello").toString("base64");
                assert.equal(chunk, expect);
            }
        },
        "when write() is called with a string in base64 encoding": {
            topic: function () {
                this.content = "hello";

                var stream = new BufferedStream;
                stream.write(new Buffer(this.content).toString("base64"), "base64");
                stream.end();

                var content = "",
                    self = this;

                stream.on("data", function (chunk) {
                    content += chunk.toString();
                });

                stream.on("end", function () {
                    self.callback(null, content);
                });
            },
            "should use the proper encoding": function (content) {
                assert.equal(content, this.content);
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
                var source = new BufferedStream(this.content);
                bufferSource(source, this.callback);
            },
            "should emit that stream's content": function (content) {
                assert.equal(content, this.content);
            },
            "and temporarily paused": {
                topic: function () {
                    this.content = "Hello world";
                    var source = new BufferedStream(this.content);
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
    var stream = new BufferedStream(source);
    var content = "";

    stream.on("data", function (chunk) {
        content += chunk.toString();
    });

    stream.on("end", function () {
        callback(null, content);
    });

    return stream;
}

function temporarilyPauseThenBufferSource(source, callback) {
    var stream = bufferSource(source, callback);

    stream.pause();

    setTimeout(function () {
        stream.resume();
    }, 1);
}
