var utils = require('./utils');
var urlMap = require('./urlmap');
var router = require('./router');

/**
 * A middleware that may be used to construct a middleware pipeline. It does
 * this by providing a useful use abstraction to allow users to declare the
 * middleware they want to use in the order they will be called in the request
 * cycle.
 *
 * Instances of this middleware also have all methods from the urlMap and router
 * middlewares in order to simplify the number of steps needed to build an app
 * complete with a middleware pipeline, URL prefix mapping, and routing.
 *
 * Furthermore, calling any build method on the strata module itself will
 * automatically create an instance of this middleware, as in the following
 * example.
 *
 *   var strata = require('strata');
 *
 *   strata.use(strata.contentLength);
 *   strata.use(strata.contentType, 'text/html');
 *   strata.use(strata.sessionCookie);
 *
 *   strata.map('/images', function (app) {
 *     // This app is called for all requests starting with "/images". Let's
 *     // try to serve them out of /path/to/images using a strata.file.
 *     app.use(strata.file, '/path/to/images');
 *   });
 *
 *   strata.get('/', function (env, callback) {
 *     // This is called on GET /
 *   });
 *
 *   strata.run(function (env, callback) {
 *     // This function is called when no mappings/routes match.
 *     callback(200, {}, 'Hello world!');
 *   });
 */
module.exports = function (app, callback) {
  if (typeof callback === 'undefined' && typeof app === 'function') {
    callback = app;
    app = null;
  }

  app = app || utils.notFound;

  var middlewareStack = [];
  var locations;
  var localRouter;

  function build(env, callback) {
    if (locations) {
      app = makeMap(app, locations);
      locations = null;
    }

    while (middlewareStack.length) {
      app = middlewareStack.pop()(app);
    }

    app(env, callback);
  }

  /**
   * Specifies a middleware function that is added to this build's
   * middleware pipeline. This middleware will be called later with the
   * downstream app as its first argument and any additional arguments
   * supplied here.
   *
   * IMPORTANT: Calls to use and map are interleaved so that apps mounted
   * using map will only be subject only to middleware that was declared
   * before the call to map was made.
   */
  build.use = function (middleware) {
    var args = Array.prototype.slice.call(arguments, 1);

    if (locations) {
      (function (locations) {
        middlewareStack.push(function (app) {
          return makeMap(app, locations);
        });
      })(locations);

      locations = null;
    }

    middlewareStack.push(function (app) {
      return middleware.apply(this, [app].concat(args));
    });
  };

  /**
   * Creates a new build middleware and "mounts" it at the given URL prefix
   * (the location argument) using a urlMap middleware. This means that all
   * requests beginning with the given location are routed to this new build.
   * The callback is called later with the new build middleware so that it
   * may be configured further.
   */
  build.map = function (location, callback) {
    if (!locations) {
      locations = {};
    }

    locations[location] = callback;
  };

  // Add the ability to call router functions. When one is called, instantiate
  // the localRouter variable and call the function on that object.

  ['route', 'get', 'post', 'put', 'delete', 'head', 'options'].forEach(function (method) {
    build[method] = function () {
      if (localRouter == null) {
        localRouter = router();
        app = localRouter;
      }

      return localRouter[method].apply(localRouter, arguments);
    };
  });

  /**
   * Specifies the app to run after all middleware.
   */
  build.run = function (localApp) {
    // If one of the routing methods has been called, delegate to the router.
    if (localRouter) {
      localRouter.run(localApp);
    } else {
      app = localApp;
    }
  };

  if (typeof callback === 'function') {
    callback(build);
  }

  return build;
};

function makeMap(app, locations) {
  var map = urlMap(app);

  for (var location in locations) {
    // Make a new build and pass it to the callback for the given location.
    map.map(location, module.exports(null, locations[location]));
  }

  return map;
}
