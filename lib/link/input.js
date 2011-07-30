var util = require("util"),
    EventEmitter = require("events").EventEmitter;

module.exports = Input;

/**
 * A simple stream wrapper for request input.
 */
function Input(stream) {
    EventEmitter.call(this);
    this._stream = stream;
    var self = this;

    stream.on("data", function (chunk) {
        self.emit("data", chunk);
    });

    stream.on("end", function () {
        self.emit("end");
    });
}

util.inherits(Input, EventEmitter);

Input.prototype.setEncoding = function setEncoding(encoding) {
    return this._stream.setEncoding(encoding);
}

Input.prototype.pause = function pause() {
    return this._stream.pause();
}

Input.prototype.resume = function resume() {
    return this._stream.resume();
}
