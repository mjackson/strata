var utils = require("./utils"),
    urlmap = require("./urlmap");

module.exports = Builder;

/**
 * Provides a convenient interface for iteratively constructing a Strata
 * application fronted by various middleware, with the ability to easily nest
 * more builders at a given location.
 */
function Builder(app) {
    this._stack = [];
    this.run(app || utils.notFound);
}

/**
 * Inserts the given middleware into the middleware stack. Any additional
 * arguments given here will be passed to the middleware, along with this
 * builder's app.
 */
Builder.prototype.use = function use(middleware) {
    var args = Array.prototype.slice.call(arguments, 1);

    if (this._map) {
        var map = this._map;
        delete this._map;

        this._stack.push(function (app) {
            return makeUrlmap(app, map);
        });
    }

    this._stack.push(function (app) {
        args.unshift(app);
        return middleware.apply(this, args);
    });
}

/**
 * Specifies a `location` at which a new Builder should be "mounted" inside this
 * one using a urlmap. The `callback` will be called with the new Builder.
 */
Builder.prototype.map = function map(location, callback) {
    if (!this._map) {
        this._map = {};
    }

    this._map[location] = callback;
}

/**
 * Specifies the given `app` to run at the root of this builder.
 */
Builder.prototype.run = function run(app) {
    this.app = app;
}

/**
 * Compiles this object to a callable app.
 */
Builder.prototype.toApp = function toApp() {
    var app = this.app;

    if (this._map) {
        app = makeUrlmap(app, this._map);
    }

    var i = this._stack.length;
    while (i) {
        app = this._stack[--i](app);
    }

    return app;
}

function makeUrlmap(app, map) {
    var mapping = {};

    var builder;
    for (var location in map) {
        builder = new Builder;
        map[location](builder);
        mapping[location] = builder.toApp();
    }

    return urlmap(mapping, app);
}
