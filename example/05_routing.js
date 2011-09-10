// One of the most common tasks in developing a web app is deciding which URL's
// trigger which application logic. Up to this point in the examples, all of the
// code samples have run only a single app, without regard for the URL that was
// used in the request. In this example, we'll use a Router to call different
// parts of our application based on the request URL.
//
// A route consists of three things: a pattern, an app, and optionally a request
// method(s). When a router is called, it searches through its routes and calls
// the app of the first one that "matches" the request. A route matches the
// request when its pattern matches the request URL and its request method
// matches the method that was used in the request (e.g. GET or POST). A route
// that has no request method(s) associated with it may match any method.
//
// All routes that have a request method that matches the one used in the
// request are tried first in the order they were defined. Any routes that have
// no request method are tried afterwards. Once a router finds a route that
// matches, it calls the corresponding app and stops trying other routes.
//
// The app below defines two routes, both at the /users URL path. The first is
// registered only for GET requests, the second for POST.
//
// Tip: When running the app, try http://localhost:1982/users

var strata = require("./../lib");

// This is our simple data store. We can post usernames to this store using
// the HTTP methods exposed by the router.
var users = [];

var app = new strata.Router;

// GET /users
// Shows a list of the users currently in the data store and a form for adding
// another name to the store.
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
app.post("/users", function (env, callback) {
    var req = new strata.Request(env);

    req.params(function (err, params) {
        if (err && strata.handleError(err, env, callback)) {
            return;
        }

        if (params.username) {
            users.push(params.username);
        }

        // Redirect to /users.
        callback(302, {
            "Content-Type": "text/plain",
            "Location": "/users"
        }, "");
    });
});

module.exports = app;
