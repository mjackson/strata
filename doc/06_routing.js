/*
# Routing

One of the most common tasks in developing a web app is deciding which URL's
trigger which application logic. Up to this point in the examples, all of the
code samples have run only a single app, without regard for the URL that was
used in the request. In this chapter, we'll use a Router to call different
parts of our application based on the request URL.

A route consists of three things: a pattern, an app, and optionally a request
method(s). When a router is called, it searches through its routes and calls
the app of the first route that "matches" the request. A route matches the
request when its pattern matches the request URL and its request method
matches the method that was used in the request (e.g. GET or POST). A route
that has no request method(s) associated with it may match any method.

A router uses the following algorithm to find a matching route:

  1. Try all routes whose request method matches the one used in the request
     in the order they were defined
  2. Try all routes that are not restricted to a request method in the order
     they were defined

Once a router finds a route that matches, it calls the corresponding app and
stops trying other routes.

The app below defines two routes, both at the `/users` URL path. The first is
registered only for GET requests, the second for POST.
*/

var strata = require("strata"),
    Request = strata.Request,
    Router = strata.Router,
    redirect = strata.redirect;

// This is our simple data store.
var users = [];

// The app given to the Router constructor serves as the default app when none
// of the routes match.
var app = new Router(function (env, callback) {
    var content = 'Try <a href="/users">/users</a>.';

    callback(200, {
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(content).toString()
    }, content);
});

// GET /users
// Shows a list of the users currently in the data store and a form for adding
// another name to the store.
// Note: app.get(pattern, app) is sugar for app.route(pattern, app, "GET")
app.get("/users", function (env, callback) {
    var content;
    if (users.length == 0) {
        content = "<p>There are no users!</p>";
    } else {
        content = "<p>The users are: " + users.join(", ") + "</p>";
    }

    content += "<p>Create a new user:</p>";
    content += "<p>";
    content += '<form method="post" action="/users">';
    content += '<input type="text" name="username" placeholder="username" width="200">';
    content += '<input type="submit" value="Submit">';
    content += "</form>";
    content += "</p>";

    callback(200, {
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(content).toString()
    }, content);
});

// POST /users
// Adds a username to the data store.
// Note: app.post(pattern, app) is sugar for app.route(pattern, app, "POST")
app.post("/users", function (env, callback) {
    var req = new Request(env);

    req.params(function (err, params) {
        if (err && strata.handleError(err, env, callback)) {
            return;
        }

        if (params.username) {
            users.push(params.username);
        }

        // Redirect to /users.
        redirect(env, callback, "/users");
    });
});

module.exports = app;

/*
As in previous chapters, you can save the above code to a file named `app.js`
and run it with:

    $ strata app.js

Then view the app at [http://localhost:1982/users](http://localhost:1982/users).
*/
