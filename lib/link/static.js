var path = require("path"),
    fs = require("fs"),
    link = require("./../link"),
    mime = require("./mime");

/**
 * A middleware for serving files efficiently from the given +root+ directory
 * according to path contained in the pathInfo environment variable. If a
 * matching file cannot be found, the request is forwarded to the downstream
 * app. Otherwise, the file is streamed through to the callback.
 */
module.exports = function (app, root) {
    if (typeof root !== "string") {
        throw new link.Error("Invalid root directory");
    }

    if (path.existsSync(root)) {
        var stats = fs.statSync(root);
        if (!stats.isDirectory()) {
            throw new link.Error('"' + root + '" is not a directory')
        }
    } else {
        throw new link.Error('Directory "' + root + '" does not exist');
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
