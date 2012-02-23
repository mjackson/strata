var utils = require("./utils"),
    map = require("./map");

module.exports = buildMiddleware;

/**
 * A middleware that may be used to construct a middleware pipeline. It does
 * this by providing a useful `use` abstraction to allow users to declare the
 * middleware they want to use in the order they will be called in the request
 * cycle.
 *
 *   var app = strata.build();
 *
 *   app.use(strata.contentLength);
 *   app.use(strata.contentType, "text/html");
 *   app.use(strata.sessionCookie);
 *
 *   app.map("/images", function (app) {
 *       // This app is called for all requests starting with "/images". Let's
 *       // try to serve them out of /path/to/images using a strata.file.
 *       app.use(strata.file, "/path/to/images");
 *   });
 *
 *   app.run(function (env, callback) {
 *       callback(200, {}, "Hello world!");
 *   });
 *
 *   strata.run(app);
 */
function buildMiddleware(app) {
    app = app || utils.notFound;

    var stack = [];
    var locations;

    function build(env, callback) {
        if (locations) {
            app = makeMap(app, locations);
            locations = null;
        }

        while (stack.length) {
            app = stack.pop()(app);
        }

        app(env, callback);
    }

    /**
     * Specifies a `middleware` function that is added to this build's
     * middleware pipeline. This middleware will be called later with the
     * downstream app as its first argument and any additional arguments
     * supplied here.
     */
    build.use = function (middleware) {
        var args = Array.prototype.slice.call(arguments, 1);

        if (locations) {
            (function (locations) {
                stack.push(function (app) {
                    return makeMap(app, locations);
                });
            })(locations);

            locations = null;
        }

        stack.push(function (app) {
            return middleware.apply(this, [app].concat(args));
        });
    };

    /**
     * Creates a new build middleware and "mounts" it at the given URL prefix
     * (the `location` argument) using a map middleware. This means that all
     * requests beginning with the given location are routed to this new build.
     * The `callback` is called later with the new build middleware.
     */
    build.map = function (location, callback) {
        if (!locations) {
            locations = {};
        }

        locations[location] = callback;
    };

    /**
     * Specifies the app to run after all middleware.
     */
    build.run = function (localApp) {
        app = localApp;
    };

    return build;
}

function makeMap(app, locations) {
    var localMap = map(app);

    for (var location in locations) {
        var build = buildMiddleware();
        locations[location](build);
        localMap.map(location, build);
    }

    return localMap;
}
