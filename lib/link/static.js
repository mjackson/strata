var path = require("path"),
    fs = require("fs"),
    mime = require("./mime");

/**
 * A middleware for serving files efficiently from the given +root+ directory
 * according to path contained in the pathInfo environment variable. If a
 * matching file cannot be found, the request is forwarded to the downstream
 * app. Otherwise, the file is streamed through to the callback.
 */
module.exports = function (app, root) {
    if (typeof root !== "string") {
        throw new Error("Invalid root directory");
    }

    return function file(env, callback) {
        var fullPath = path.join(root, env.pathInfo);

        if (path.existsSync(fullPath)) {
            var stats = fs.statSync(fullPath);

            if (stats.isFile()) {
                callback(200, {
                    "Content-Type": mime.type(path.extname(fullPath)),
                    "Content-Length": stats.size,
                    "Last-Modified": stats.mtime.toUTCString()
                }, fs.createReadStream(fullPath));
            } else {
                app(env, callback);
            }
        } else {
            app(env, callback);
        }
    }
}
