var urlMap = require("./urlmap");

module.exports = Builder;

/**
 * Provides a convenient interface for iteratively constructing a Link
 * application fronted by various middleware, with the ability to easily nest
 * more builders at a certain path prefix.
 *
 *   var link = require("link");
 *   var builder = new link.Builder;
 *
 *   builder.use(link.contentLength);
 *   builder.use(link.contentType, "text/plain");
 *
 *   builder.map("/files", function (builder) {
 *       builder.use(link.static, "/var/www/public");
 *       builder.run(function (env, callback) {
 *           callback(404, {}, "File not found: " + env.pathInfo);
 *       });
 *   });
 *
 *   builder.run(function (env, callback) {
 *       callback(200, {"Content-Type": "text/html"}, "<p>Hello world!</p>");
 *   });
 *
 *   var server = link.createServer(builder);
 *   server.listen(80);
 */
function Builder(app) {
    this._use = [];
    this._map = null;

    if (app) {
        this.run(app);
    }
}

Builder.prototype.use = function use(middleware) {
    var args = Array.prototype.slice.call(arguments, 1);

    if (this._map) {
        var mapping = this._map;
        this._map = null;

        this._use.push(function (app) {
            return generateMap(app, mapping);
        });
    }

    this._use.push(function (app) {
        args.unshift(app);
        return middleware.apply(this, args);
    });
}

Builder.prototype.map = function map(path, callback) {
    if (!this._map) {
        this._map = {};
    }

    this._map[path] = callback;
}

Builder.prototype.run = function run(app) {
    this._app = app;
}

/**
 * Compiles this object to a callable app.
 */
Builder.prototype.toApp = function toApp() {
    var app = this._map ? generateMap(this._app, this._map) : this._app;

    if (!app) {
        throw new Error("Missing call to run or map");
    }

    var i = this._use.length;
    while (i) {
        app = this._use[--i](app);
    }

    return app;
}

function generateMap(app, mapping) {
    var map = app ? {"/": app} : {}

    var builder;
    for (var path in mapping) {
        builder = new Builder(app);
        mapping[path](builder);
        map[path] = builder.toApp();
    }

    return urlMap(map);
}
