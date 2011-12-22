var util = require("util"),
    BufferedStream = require("bufferedstream"),
    Gzip = require("gzbz2").Gzip;

exports.createGzip = createGzip;
exports.GzipStream = GzipStream;

function createGzip(options) {
    // Ignore options. Those are for node 0.6 zlib API.
    return new GzipStream;
}

/**
 * A small wrapper class for response bodies that gzip's the data on the way
 * through.
 */
function GzipStream(source, encoding) {
    this._gzip = new Gzip;
    this._gzip.init();

    BufferedStream.call(this, source, encoding);
}

util.inherits(GzipStream, BufferedStream);

GzipStream.prototype.write = function write(chunk) {
    return BufferedStream.prototype.write.call(this, this._gzip.deflate(chunk));
}

GzipStream.prototype.end = function end(chunk, encoding) {
    if (arguments.length > 0) {
        this.write(chunk, encoding);
    }

    BufferedStream.prototype.write.call(this, this._gzip.end());
    BufferedStream.prototype.end.call(this);
}
