var qs = require("querystring");

// TODO: Make this a streaming parser, instead of buffering.

exports.Parser = Parser;

function Parser(sep, eq) {
    this.body = "";
    this.sep = sep;
    this.eq = eq;
}

Parser.prototype.write = function write(buffer) {
    this.body += buffer.toString("ascii");
    return buffer.length;
}

Parser.prototype.end = function end() {
    var params = qs.parse(this.body, this.sep, this.eq);

    for (var param in params) {
        this.onParam(param, params[param]);
    }

    this.onEnd();
}

Parser.prototype.onParam = function onParam(name, value) {}
Parser.prototype.onEnd = function onEnd() {}
