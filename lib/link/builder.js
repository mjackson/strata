var fs = require("fs"),
    urlMap = require("./urlmap"),
    link = require("./../link");

module.exports = Builder;

/**
 * Provides a convenient interface for iteratively constructing a Link
 * application fronted by various middleware, with the ability to easily nest
 * more builders at a certain path prefix.
 *
 *   var link = require("link");
 *   var app = new link.Builder;
 *
 *   app.use(link.contentLength);
 *   app.use(link.contentType, "text/plain");
 *
 *   app.map("/files", function (app) {
 *       app.use(link.static, "/var/www/public");
 *       app.run(function (env, callback) {
 *           callback(404, {}, "File not found: " + env.pathInfo);
 *       });
 *   });
 *
 *   app.run(function (env, callback) {
 *       callback(200, {"Content-Type": "text/html"}, "<p>Hello world!</p>");
 *   });
 *
 *   var server = link.createServer(app);
 *   server.listen(80);
 */
function Builder(app) {
    this._use = [];
    this._map = null;

    if (app) {
        this.run(app);
    }
}

/**
 * Create a new Builder from the code in the given +file+. The code is
 * evaluated in the context of a new Builder object, so it may use that
 * builder's methods in the "global" scope.
 */
Builder.fromFile = function fromFile(file) {
    var code = fs.readFileSync(file, "utf8");
    var builder = new Builder;

    // Eat your heart out.
    with (builder) {
        eval(code);
    }

    return builder;
}

/**
 * Inserts the given middleware into the middleware stack. Any additional
 * arguments given here will be passed to the middleware, along with this
 * builder's app.
 */
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

/**
 * Specify a +prefix+ at which a new Builder should be mounted inside this
 * builder using a urlMap middleware. The +callback+ will be called with the
 * new Builder instance.
 */
Builder.prototype.map = function map(prefix, callback) {
    if (!this._map) {
        this._map = {};
    }

    this._map[prefix] = callback;
}

/**
 * Specifies the given +app+ to run at the root of this builder.
 */
Builder.prototype.run = function run(app) {
    this._app = app;
}

/**
 * Compiles this object to a callable app.
 */
Builder.prototype.toApp = function toApp() {
    var app = this._map ? generateMap(this._app, this._map) : this._app;

    if (!app) {
        throw new link.Error("Missing call to run or map");
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
