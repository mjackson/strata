var util = require("util"),
    path = require("path"),
    fs = require("fs"),
    EventEmitter = require("events").EventEmitter,
    strata = require("./index");

exports.Parser = Parser;
exports.Part = Part;
exports.File = File;

// This parser is modified from the one in the node-formidable
// project, written by Felix Geisendörfer. MIT licensed.

var s = 0,
    S =
    { START: s++,
      START_BOUNDARY: s++,
      HEADER_FIELD_START: s++,
      HEADER_FIELD: s++,
      HEADER_VALUE_START: s++,
      HEADER_VALUE: s++,
      HEADER_VALUE_ALMOST_DONE: s++,
      HEADERS_ALMOST_DONE: s++,
      PART_DATA_START: s++,
      PART_DATA: s++,
      PART_END: s++,
      END: s++,
    },

    f = 1,
    F =
    { PART_BOUNDARY: f,
      LAST_BOUNDARY: f *= 2,
    },

    LF = 10,
    CR = 13,
    SPACE = 32,
    HYPHEN = 45,
    COLON = 58,
    A = 97, // lower-case "a"
    Z = 122; // lower-case "z"

for (var s in S) {
    exports[s] = S[s];
}

function Parser(boundary, tmpdir, prefix) {
    tmpdir = tmpdir || "/tmp";
    prefix = prefix || "";

    if (!path.existsSync(tmpdir)) {
        throw new strata.Error('Temporary directory "' + tmpdir + '" does not exist');
    }

    if (!fs.statSync(tmpdir).isDirectory()) {
        throw new strata.Error('"' + tmpdir + '" is not a directory');
    }

    this.boundary = new Buffer(boundary.length + 4);
    this.boundary.write("\r\n--", "ascii", 0);
    this.boundary.write(boundary, "ascii", 4);

    this.tmpdir = tmpdir;
    this.prefix = prefix;
    this.lookBehind = new Buffer(this.boundary.length + 8);
    this.state = S.START;

    this.boundaryChars = {};
    var i = this.boundary.length;
    while (i) {
        this.boundaryChars[this.boundary[--i]] = true;
    }

    this.index = null;
    this.flags = 0;

    this._done = false; // Are we done with writes?
    this._flushing = 0; // How many files are still being flushed to disk?
}

Parser.prototype.tmpfile = function tmpfile() {
    var name = this.prefix;

    for (var i = 0; i < 32; ++i) {
        name += Math.round(Math.random() * 16).toString(16);
    }

    return path.join(this.tmpdir, name);
}

Parser.prototype.write = function write(buffer) {
    var self = this,
        bufferLength = buffer.length,
        prevIndex = this.index,
        index = this.index,
        state = this.state,
        flags = this.flags,
        lookBehind = this.lookBehind,
        boundary = this.boundary,
        boundaryChars = this.boundaryChars,
        boundaryLength = boundary.length,
        boundaryEnd = boundaryLength - 1,
        c,
        cl;

    for (var i = 0; i < bufferLength; ++i) {
        c = buffer[i];

        switch (state) {
        case S.START:
            index = 0;
            state = S.START_BOUNDARY;
            // fall through
        case S.START_BOUNDARY:
            if (index == boundaryLength - 2) {
                if (c != CR) {
                    return i;
                }
                index++;
                break;
            } else if (index == boundaryLength - 1) {
                if (c != LF) {
                    return i;
                }
                index = 0;
                this._callback("partBegin");
                state = S.HEADER_FIELD_START;
                break;
            }

            if (c != boundary[index + 2]) {
                return i;
            }
            index++;
            break;
        case S.HEADER_FIELD_START:
            state = S.HEADER_FIELD;
            this._mark("headerName", i);
            index = 0;
            // fall through
        case S.HEADER_FIELD:
            if (c == CR) {
                this._clear("headerName");
                state = S.HEADERS_ALMOST_DONE;
                break;
            }

            index++;
            if (c == HYPHEN) {
                break;
            }

            if (c == COLON) {
                if (index == 1) {
                    // empty header field
                    return i;
                }
                this._dataCallback("headerName", buffer, true, i);
                state = S.HEADER_VALUE_START;
                break;
            }

            cl = c | 0x20; // lower-case
            if (cl < A || cl > Z) {
                return i;
            }
            break;
        case S.HEADER_VALUE_START:
            if (c == SPACE) {
                break;
            }
            this._mark("headerValue", i);
            state = S.HEADER_VALUE;
            // fall through
        case S.HEADER_VALUE:
            if (c == CR) {
                this._dataCallback("headerValue", buffer, true, i);
                this._callback("headerEnd");
                state = S.HEADER_VALUE_ALMOST_DONE;
            }
            break;
        case S.HEADER_VALUE_ALMOST_DONE:
            if (c != LF) {
                return i;
            }
            state = S.HEADER_FIELD_START;
            break;
        case S.HEADERS_ALMOST_DONE:
            if (c != LF) {
                return i;
            }
            this._callback("headersEnd");
            state = S.PART_DATA_START;
            break;
        case S.PART_DATA_START:
            state = S.PART_DATA
            this._mark("partData", i);
            // fall through
        case S.PART_DATA:
            prevIndex = index;

            if (index == 0) {
                // boyer-moore derrived algorithm to safely skip non-boundary data
                i += boundaryEnd;
                while (i < bufferLength && !(buffer[i] in boundaryChars)) {
                    i += boundaryLength;
                }
                i -= boundaryEnd;
                c = buffer[i];
            }

            if (index < boundaryLength) {
                if (boundary[index] == c) {
                    if (index == 0) {
                        this._dataCallback("partData", buffer, true, i);
                    }
                    index++;
                } else {
                    index = 0;
                }
            } else if (index == boundaryLength) {
                index++;
                if (c == CR) {
                    // CR = part boundary
                    flags |= F.PART_BOUNDARY;
                } else if (c == HYPHEN) {
                    // HYPHEN = end boundary
                    flags |= F.LAST_BOUNDARY;
                } else {
                    index = 0;
                }
            } else if (index - 1 == boundaryLength) {
                if (flags & F.PART_BOUNDARY) {
                    index = 0;
                    if (c == LF) {
                        // unset the PART_BOUNDARY flag
                        flags &= ~F.PART_BOUNDARY;
                        this._callback("partEnd");
                        this._callback("partBegin");
                        state = S.HEADER_FIELD_START;
                        break;
                    }
                } else if (flags & F.LAST_BOUNDARY) {
                    if (c == HYPHEN) {
                        this._callback("partEnd");
                        // this._callback("end");
                        state = S.END;
                    } else {
                        index = 0;
                    }
                } else {
                    index = 0;
                }
            }

            if (index > 0) {
                // when matching a possible boundary, keep a lookBehind
                // reference in case it turns out to be a false lead
                lookBehind[index - 1] = c;
            } else if (prevIndex > 0) {
                // if our boundary turned out to be rubbish, the captured
                // lookBehind belongs to partData
                this._callback("partData", lookBehind, 0, prevIndex);
                prevIndex = 0;
                this._mark("partData", i);

                // reconsider the current character even so it interrupted the
                // sequence it could be the beginning of a new sequence
                i--;
            }

            break;
        case S.END:
            break;
        default:
            return i;
        }
    }

    this._dataCallback("headerName", buffer);
    this._dataCallback("headerValue", buffer);
    this._dataCallback("partData", buffer);

    this.index = index;
    this.state = state;
    this.flags = flags;

    return bufferLength;
}

Parser.prototype._mark = function mark(name, i) {
    this[name + "Mark"] = i;
}

Parser.prototype._clear = function clear(name) {
    delete this[name + "Mark"];
}

Parser.prototype._callback = function callback(name, buffer, start, end) {
    if (start !== undefined && start === end) {
        return;
    }

    var prop = "on" + name.substr(0, 1).toUpperCase() + name.substr(1);

    if (prop in this) {
        this[prop](buffer, start, end);
    }
}

Parser.prototype._dataCallback = function dataCallback(name, buffer, clear, i) {
    var prop = name + "Mark";

    if (prop in this) {
        if (!clear) {
            this._callback(name, buffer, this[prop], buffer.length);
            this[prop] = 0;
        } else {
            this._callback(name, buffer, this[prop], i);
            delete this[prop];
        }
    }
}

Parser.prototype.onPartBegin = function onPartBegin() {
    this._part = new Part;
    this._headerName = "";
    this._headerValue = "";
}

Parser.prototype.onHeaderName = function onHeaderName(buffer, start, end) {
    this._headerName += buffer.toString("utf8", start, end);
}

Parser.prototype.onHeaderValue = function onHeaderValue(buffer, start, end) {
    this._headerValue += buffer.toString("utf8", start, end);
}

Parser.prototype.onHeaderEnd = function onHeaderEnd() {
    var headerName = this._headerName.toLowerCase();
    this._part.headers[headerName] = this._headerValue;
    this._headerName = "";
    this._headerValue = "";
}

Parser.prototype.onHeadersEnd = function onHeadersEnd() {
    this.onPart(this._part);
}

Parser.prototype.onPartData = function onPartData(buffer, start, end) {
    this._part.write(buffer.slice(start, end));
}

Parser.prototype.onPartEnd = function onPartEnd() {
    this._part.end();
}

Parser.prototype.end = function end() {
    if (this.state !== S.END) {
        throw new strata.Error("Stream ended unexpectedly (state: " + this.state + ")");
    }

    this._done = true;
    this._maybeEnd();
}

Parser.prototype.onPart = function onPart(part) {
    var filename = part.filename,
        self = this;

    if (filename) {
        this._flushing += 1;

        var file = new File(this.tmpfile(), part.type, filename);

        this.onFile(file);

        file.on("end", function () {
            self.onParam(part.name, file);
            self._flushing -= 1;
            self._maybeEnd();
        });

        part.on("data", function (buffer) {
            file.write(buffer);
        });

        part.on("end", function () {
            file.end();
        });
    } else {
        var content = "";

        part.on("data", function (buffer) {
            content += buffer.toString("utf8");
        });

        part.on("end", function () {
            self.onParam(part.name, content);
        });
    }
}

Parser.prototype._maybeEnd = function maybeEnd() {
    // Make sure that we're both done with the input (i.e. Parser.end was
    // called) AND that we're done flushing all files to disk.
    if (!this._done || this._flushing) {
        return;
    }

    this.onEnd();
}

Parser.prototype.onFile = function onFile(file) {}
Parser.prototype.onParam = function onParam(name, value) {}
Parser.prototype.onEnd = function onEnd() {}


/**
 * A container class for data pertaining to one part of a multipart message.
 */
function Part() {
    this.headers = {};
}

util.inherits(Part, EventEmitter);

/**
 * Returns the name of this part.
 */
Part.prototype.__defineGetter__("name", function name() {
    var disposition = this.headers["content-disposition"],
        match;

    if (disposition && (match = disposition.match(/name="([^"]+)"/i))) {
        return match[1];
    }

    return this.headers["content-id"] || null;
});

/**
 * Returns the filename of this part if it originated from a file upload.
 */
Part.prototype.__defineGetter__("filename", function filename() {
    var disposition = this.headers["content-disposition"];

    if (disposition) {
        var match = disposition.match(/filename="([^;]*)"/i),
            filename;

        if (match) {
            filename = decodeURIComponent(match[1].replace(/\\"/g, '"'));
        } else {
            // Match unquoted filename.
            match = disposition.match(/filename=([^;]+)/i);
            if (match) {
                filename = decodeURIComponent(match[1]);
            }
        }

        if (filename) {
            // Take the last part of the filename. This handles full Windows
            // paths given by IE (and possibly other dumb clients).
            return filename.substr(filename.lastIndexOf("\\") + 1);
        }
    }

    return null;
});

/**
 * Returns the Content-Type of this part.
 */
Part.prototype.__defineGetter__("type", function type() {
    return this.headers["content-type"] || null;
});

Part.prototype.write = function write(buffer) {
    this.emit("data", buffer);
}

Part.prototype.end = function end() {
    this.emit("end");
}


/**
 * A container class for data pertaining to a file upload stored on disk.
 * Constructor parameters are:
 *
 *   - path     The full path to the temporary file on disk
 *   - type     The Content-Type of the file
 *   - name     The name of the original file
 */
function File(path, type, name) {
    this.path = path;
    this.type = type;
    this.name = name;
    this.size = 0;
}

util.inherits(File, EventEmitter);

/**
 * Returns the media type of the file, which is the content type with any extra
 * parameters stripped (e.g. "text/plain;charset=utf-8" becomes "text/plain").
 */
File.prototype.__defineGetter__("mediaType", function mediaType() {
    return (this.type || "").split(/\s*[;,]\s*/)[0].toLowerCase();
});

File.prototype.write = function write(buffer) {
    if (!this._writeStream) {
        this._writeStream = fs.createWriteStream(this.path);
    }

    this.emit("write");

    var self = this;
    this._writeStream.write(buffer, function () {
        self.size += buffer.length;
        self.emit("progress", self.size);
    });
}

File.prototype.end = function end() {
    var self = this;
    this._writeStream.end(function () {
        delete self._writeStream;
        self.emit("end");
    });
}
