var util = require("util"),
    Stream = require("stream").Stream;

module.exports = BufferedStream;

BufferedStream.defaultMaxSize = Math.pow(2, 16); // 64k

/**
 * A readable/writable Stream that buffers data until next tick.
 */
function BufferedStream(maxSize, source, encoding) {
    Stream.call(this);

    if (typeof maxSize != "number") {
        encoding = source;
        source = maxSize;
        maxSize = BufferedStream.defaultMaxSize;
    }

    // This is not a hard limit. It's only used to indicate to other streams
    // writing to this one when they should pause.
    this.maxSize = maxSize;

    this._buffer = [];
    this._wait = false;
    this._size = 0;
    this.encoding = null;
    this.readable = true;
    this.writable = true;
    this.ended = false;

    var self = this;

    process.nextTick(function tick() {
        if (self.readable || self._buffer.length) {
            var wasFull = self.full;

            var chunk;
            while (self.readable && self._buffer.length && !self._wait) {
                chunk = self._buffer.shift();

                if (self.encoding) {
                    self.emit("data", chunk.toString(self.encoding));
                } else {
                    self.emit("data", chunk);
                }

                self._size -= chunk.length;
            }

            // If the buffer was full but has some room now, emit "drain".
            if (wasFull && !self.full) {
                self.emit("drain");
            }

            process.nextTick(tick);
        }
    });

    if (typeof source != "undefined") {
        if (source instanceof Stream) {
            source.pipe(this);
        } else {
            this.end(source, encoding);
        }
    }
}

util.inherits(BufferedStream, Stream);

/**
 * A read-only property that returns `true` if this stream has no data to emit.
 */
BufferedStream.prototype.__defineGetter__("empty", function () {
    return this._buffer.length == 0;
});

/**
 * A read-only property that returns `true` if this stream's buffer is full.
 */
BufferedStream.prototype.__defineGetter__("full", function () {
    return this.maxSize < this._size;
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
 * Writes the given `chunk` of data to this stream. Returns `false` if this
 * stream is full and should not be written to further until drained, `true`
 * otherwise.
 */
BufferedStream.prototype.write = function write(chunk, encoding) {
    if (!this.writable || this.ended) {
        throw new Error("Stream is not writable");
    }

    if (typeof chunk == "string") {
        chunk = new Buffer(chunk, encoding);
    }

    this._buffer.push(chunk);
    this._size += chunk.length;

    return !this.full;
}

BufferedStream.prototype.end = function end(chunk, encoding) {
    if (arguments.length > 0) {
        this.write(chunk, encoding);
    }

    var self = this;

    this.destroySoon(function () {
        self.emit("end");
    });

    this.ended = true;
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
 * Destroys this stream immediately. It is no longer readable or writable.
 */
BufferedStream.prototype.destroy = function destroy() {
    this._buffer = [];
    this.readable = false;
    this.writable = false;
}
