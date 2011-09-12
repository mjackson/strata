var utils = require("./utils"),
    Mapper = require("./mapper"),
    Router = require("./router");

module.exports = Builder;

/**
 * Provides a convenient interface for iteratively constructing a Strata
 * application fronted by various middleware, with the ability to easily nest
 * more builders at a given location.
 *
 * See example/builder.js for an example.
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

    if (this._routes) {
        var routes = this._routes;
        delete this._routes;

        this._stack.push(function (app) {
            return makeRouter(app, routes);
        });
    }

    if (this._mapping) {
        var mapping = this._mapping;
        delete this._mapping;

        this._stack.push(function (app) {
            return makeMapper(app, mapping);
        });
    }

    this._stack.push(function (app) {
        args.unshift(app);
        return middleware.apply(this, args);
    });
}

/**
 * Specifies a +location+ at which a new Builder should be "mounted" inside this
 * one using a Mapper. The +callback+ will be called with the new Builder.
 */
Builder.prototype.map = function map(location, callback) {
    if (!this._mapping) {
        this._mapping = {};
    }

    this._mapping[location] = callback;
}

/**
 * Specifies an +app+ to run when the pathInfo matches the given +pattern+
 * (and optionally +methods+). Accepts the same arguments as Router.route.
 */
Builder.prototype.route = function route(pattern, app, methods) {
    if (!this._routes) {
        this._routes = [];
    }

    this._routes.push([pattern, app, methods]);
}

var methods = {
    get: "GET",
    post: "POST",
    put: "PUT",
    del: "DELETE",
    head: "HEAD",
    options: "OPTIONS"
};

for (var method in methods) {
    (function (verb) {
        Builder.prototype[method] = function (pattern, app) {
            this.route(pattern, app, verb);
        }
    })(methods[method]);
}

/**
 * Specifies the given +app+ to run at the root of this builder.
 */
Builder.prototype.run = function run(app) {
    this.app = app;
}

/**
 * Compiles this object to a callable app.
 */
Builder.prototype.toApp = function toApp() {
    var app = this.app;

    if (this._routes) {
        app = makeRouter(app, this._routes);
    }

    if (this._mapping) {
        app = makeMapper(app, this._mapping);
    }

    var i = this._stack.length;
    while (i) {
        app = this._stack[--i](app);
    }

    return app;
}

function makeRouter(app, routes) {
    var router = new Router(app);

    for (var i = 0, len = routes.length; i < len; ++i) {
        router.route.apply(router, routes[i]);
    }

    return router.toApp();
}

function makeMapper(app, mapping) {
    var mapper = new Mapper(app);

    var builder;
    for (var location in mapping) {
        builder = new Builder(app);
        mapping[location](builder);
        mapper.map(location, builder.toApp());
    }

    return mapper.toApp();
}
