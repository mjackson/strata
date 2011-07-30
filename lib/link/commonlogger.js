var Request = require("./request"),
    utils = require("./utils");

/**
 * A middleware that logs the request to the given +stream+ on its way out,
 * similar to the Apache web server.
 */
module.exports = function (app, stream) {
    stream = stream || process.stderr;

    // Common Log Format: http://httpd.apache.org/docs/1.3/logs.html#common
    // LogFormat "%h %l %u %t \"%r\" %>s %b" common
    // 127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326

    return function commonLogger(env, callback) {
        app(env, function (status, headers, body) {
            var req = new Request(env);

            var host = env.httpXForwardedFor || "-",
                id = "-",
                user = "-",
                timestamp = "[" + utils.strftime(new Date, "%d/%b/%Y:%H:%M:%S %Z") + "]",
                reqline = '"' + req.method + " " + req.fullPath + " HTTP/" + env.protocolVersion  + '"',
                length = parseInt(headers["Content-Length"], 10) || 0;

            if (!length && typeof body === "string") {
                length = body.length;
            }

            var entry = [host, id, user, timestamp, reqline, String(status), length].join(" ");
            stream.write(entry + "\n");

            callback(status, headers, body);
        });
    }
}
