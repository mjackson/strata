/*
# Routing

One of the most common tasks in developing a web app is deciding which URL's
trigger which application logic. Up to this point in the examples, all of the
code samples have run only a single app, without regard for the URL that was
used in the request. In this chapter, we'll use a router to call different
parts of our application based on the request URL.

A route consists of three things: a **pattern**, an **app**, and optionally a
**request method**. When a router is called, it searches through its routes and
calls the app of the first route that "matches" the request. A route matches the
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

Note: This example uses [Mustache](https://github.com/janl/mustache.js) for
template rendering. To install it, use `npm install mustache`.
*/

var strata = require("strata"),
    redirect = strata.redirect,
    mustache = require("mustache");

// This is our simple data store.
var users = [];

// Define a template. This would normally be stored in a template file.
var userListTemplate = [
    '{{^users}}',
    '<p>There are no users!</p>',
    '{{/users}}',
    '{{#hasUsers}}',
    '<p>The users are:</p>',
    '<ul>',
    '{{#users}}',
    '  <li>{{.}}</li>',
    '{{/users}}',
    '</ul>',
    '{{/hasUsers}}',
    '<p>Create a new user:</p>',
    '<p>',
    '<form method="post" action="/users">',
    '<input type="text" name="username" placeholder="username" width="200">',
    '<input type="submit" value="Submit">',
    '</form>',
    '</p>'
].join("\n");

strata.use(strata.commonLogger);
strata.use(strata.contentType, "text/html");
strata.use(strata.contentLength);

// Shows a list of the users currently in the data store and a form for adding
// another name to the store.
strata.get("/users", function (env, callback) {
    var content = mustache.to_html(userListTemplate, {
        hasUsers: users.length != 0,
        users: users
    });

    callback(200, {}, content);
});

// Adds a username to the data store.
strata.post("/users", function (env, callback) {
    var req = new strata.Request(env);

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

strata.run(function (env, callback) {
    callback(200, {}, 'Try <a href="/users">/users</a>.');
});

/*
As in previous chapters, you can save the above code to a file named `app.js`
and run it with the `node` executable:

    $ node app.js

Then view the app at [http://localhost:1982/users](http://localhost:1982/users).

## Using Multiple Methods

You can easily configure an app to be used for several different routes by using
the slightly more verbose `Router#route` method. This function takes the same
first two arguments as `Router#get` and `Router#post`, but also takes an
additional argument that may specify any number of request methods to use for
the app. For example, both of the following are perfectly valid.

    app.route("/users", function (env, callback) { ... }, "GET");
    app.route("/users", function (env, callback) { ... }, ["GET", "POST"]);

If no request method is given when using `Router#route`, the router will
consider that route valid for all requests whose pattern match the URL in the
request, regardless of request method.
*/
