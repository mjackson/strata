var util = require("util"),
    Stream = require("stream").Stream;

module.exports = BufferedStream;

/**
 * A readable/writable Stream that buffers data until next tick.
 */
function BufferedStream(maxSize, source, encoding) {
    Stream.call(this);

    if (typeof maxSize != "number") {
        encoding = source;
        source = maxSize;
        maxSize = -1;
    }

    // This is a soft limit. It's only used to indicate to other streams
    // writing to this one when they should pause. If negative, this stream
    // will buffer indefinitely.
    this.maxSize = maxSize;

    this._buffer = [];
    this._wait = false;
    this._size = 0;
    this._flushing = false;
    this._wasFull = false;
    this.encoding = null;
    this.readable = true;
    this.writable = true;
    this.ended = false;

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
    return this.maxSize > 0 && this.maxSize < this._size;
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

    if (!this._flushing) {
        var self = this;

        process.nextTick(function tick() {
            self.flush();

            if (self.empty) {
                self._flushing = false;
            } else {
                process.nextTick(tick);
            }
        });

        this._flushing = true;
    }

    if (this.full) {
        this._wasFull = true;
        return false;
    }

    return true;
}

/**
 * Tries to emit all data that is currently in the buffer out to all `data`
 * listeners. If this stream is paused, not readable, has no data in the buffer
 * this method does nothing. If this stream has previously returned `false` from
 * a write and any space is available in the buffer after flushing, a `drain`
 * event is emitted.
 */
BufferedStream.prototype.flush = function () {
    var chunk;
    while (!this._wait && this.readable && this._buffer.length) {
        chunk = this._buffer.shift();

        if (this.encoding) {
            this.emit("data", chunk.toString(this.encoding));
        } else {
            this.emit("data", chunk);
        }

        this._size -= chunk.length;
    }

    // Emit "drain" if the stream was full at one point but now
    // has some room in the buffer.
    if (this._wasFull && !this.full) {
        this._wasFull = false;
        this.emit("drain");
    }
}

/**
 * Writes the given `chunk` to this stream and queues the `end` event to be
 * called as soon as all `data` events have been emitted.
 */
BufferedStream.prototype.end = function end(chunk, encoding) {
    if (this.ended) {
        throw new Error("Stream is already ended");
    }

    if (arguments.length > 0) {
        this.write(chunk, encoding);
    }

    this.ended = true;

    var self = this;

    process.nextTick(function tick() {
        if (self.empty) {
            self.destroy();
            self.emit("end");
        } else {
            process.nextTick(tick);
        }
    });
}

/**
 * Destroys this stream immediately. It is no longer readable or writable. This
 * method should rarely ever be called directly by users as it will be called
 * automatically when using BufferedStream#end.
 */
BufferedStream.prototype.destroy = function destroy() {
    this._buffer = [];
    this.readable = false;
    this.writable = false;
}
