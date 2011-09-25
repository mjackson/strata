var util = require("util"),
    Stream = require("stream").Stream;

module.exports = BufferedStream;

BufferedStream.defaultMaxSize = Math.pow(2, 16); // 64k

/**
 * A readable/writable Stream that buffers data until next tick.
 */
function BufferedStream(maxSize, source) {
    Stream.call(this);

    if (typeof maxSize != "number") {
        source = maxSize;
        maxSize = BufferedStream.defaultMaxSize;
    }

    this.maxSize = maxSize;

    this._chunks = [];
    this._wait = false;
    this._size = 0;
    this.encoding = null;
    this.readable = true;
    this.writable = true;

    var self = this;

    process.nextTick(function tick() {
        if (self.readable || self._chunks.length) {
            var wasEmpty = self.empty;

            var chunk;
            while (self.readable && self._chunks.length && !self._wait) {
                chunk = self._chunks.shift();

                if (self.encoding) {
                    self.emit("data", chunk.toString(self.encoding));
                } else {
                    self.emit("data", chunk);
                }

                self._size -= chunk.length;
            }

            if (!wasEmpty && self.empty) {
                self.emit("drain");
            }

            process.nextTick(tick);
        }
    });

    if (typeof source != "undefined") {
        this.proxy(source);
    }
}

util.inherits(BufferedStream, Stream);

/**
 * A read-only property that returns `true` if this stream has no data to emit.
 */
BufferedStream.prototype.__defineGetter__("empty", function () {
    return this._chunks.length == 0;
});

/**
 * Sets this stream's encoding. If an encoding is set, this stream will emit
 * strings using that encoding. Otherwise, it emits buffers.
 */
BufferedStream.prototype.setEncoding = function setEncoding(encoding) {
    this.encoding = encoding;
}

/**
 * Prevents this stream from emitting `data` events until `resume` is called.
 * This does not prevent writes to this stream.
 */
BufferedStream.prototype.pause = function pause() {
    this._wait = true;
    this.emit("pause");
}

/**
 * Resumes emitting `data` events.
 */
BufferedStream.prototype.resume = function resume() {
    this._wait = false;
    this.emit("resume");
}

/**
 * Writes the given `chunk` of data to this stream. Returns `true` if the data
 * was written to the buffer, `false` otherwise.
 */
BufferedStream.prototype.write = function write(chunk, encoding) {
    if (!this.writable) {
        throw new Error("Stream is not writable");
    }

    if (typeof chunk == "string") {
        chunk = new Buffer(chunk, encoding);
    }

    var length = chunk.length;

    if (this._size + length < this.maxSize) {
        this._chunks.push(chunk);
        this._size += length;
        return true;
    }

    return false;
}

BufferedStream.prototype.end = function end() {
    this.writable = false;

    var self = this;

    this.destroySoon(function () {
        self.emit("end");
    });
}

BufferedStream.prototype.destroy = function destroy() {
    this._chunks = [];
    this.readable = false;
    this.writable = false;
}

/**
 * Destroys this stream as soon it is empty. Calls the given `callback` when
 * finished.
 */
BufferedStream.prototype.destroySoon = function destroySoon(callback) {
    if (this.empty) {
        this.destroy();

        if (typeof callback == "function") {
            callback();
        }

        return;
    }

    var self = this;

    process.nextTick(function () {
        self.destroySoon(callback);
    });
}

/**
 * Proxies all data from the given `source` through this stream. The `source`
 * may be another Stream, Buffer, or string.
 *
 * TODO: Support various source encodings.
 */
BufferedStream.prototype.proxy = function proxy(source) {
    if (source instanceof Stream) {
        source.pipe(this);
        return;
    }

    if (this.write(source)) {
        this.end();
        return;
    }

    var self = this;

    process.nextTick(function () {
        self.proxy(source);
    });
}
