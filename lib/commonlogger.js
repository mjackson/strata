var strftime = require("strftime").strftime,
    Request = require("./request");

/**
 * A middleware that logs the request to the given `stream` on its way out,
 * similar to Apache's Common Log Format
 * (see http://httpd.apache.org/docs/1.3/logs.html#common).
 */
module.exports = function (app, stream) {
    stream = stream || process.stderr;

    // LogFormat "%h %l %u %t \"%r\" %>s %b" common
    // 127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326

    return function commonLogger(env, callback) {
        app(env, function (status, headers, body) {
            var req = new Request(env);

            var addr = req.remoteAddr || "-",
                id = "-",
                user = env.remoteUser || "-",
                timestamp = "[" + strftime("%d/%b/%Y:%H:%M:%S %z", env.requestTime) + "]",
                protoVersion = "HTTP/" + env.protocolVersion,
                reqline = '"' + req.method + " " + req.fullPath + " " + protoVersion  + '"',
                length = "-";

            if ("Content-Length" in headers) {
                length = headers["Content-Length"];
            } else if (typeof body === "string") {
                length = String(Buffer.byteLength(body));
            } else if (typeof body.length === "number") {
                length = String(body.length);
            }

            var entry = [addr, id, user, timestamp, reqline, status, length].join(" ");
            stream.write(entry + "\n");

            callback(status, headers, body);
        });
    }
};
