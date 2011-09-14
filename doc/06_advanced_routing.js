/*
# Advanced Routing

Sometimes you need to be able to capture certain segments of the URL to use
in your application logic. For example, in a traditional REST app you might
have a URL that looks like `/users/:id` where the `:id` portion may be any
valid user id. Strata supports two similar routing mechanisms that allow you
to retrieve this data.

The first is to use a Ruby-like symbol notation within a string, as is common
in the [Rails](http://rubyonrails.org/) and [Sinatra](http://www.sinatrarb.com/)
web frameworks. Strata recognizes any sequence of a colon followed by an
alpha character and any number of alpha-numeric characters or underscores as
one of these symbols. They match any non-empty sequence of characters in the
URL up to a `/`, `?`, or `#`.

The second method is to use a pure regular expression. This method provides
you with the most fine-grained control over the matching behavior of the
pattern.

When a pattern matches the URL, the results of the match are stored in the
`route` environment variable. This variable contains the original string that
matched as well as any captures that were present in the pattern. It also has
getter/setter properties for any segments of the URL that were defined as
symbols.

The example below expands upon the example in the previous chapter and adds
support for viewing and deleting a user with a particular id. By now, some of
the common tasks of setting the `Content-Length` and `Content-Type` of every
response by hand is getting a bit tedious, so we'll use some middleware to
do these tasks for us.
*/

var strata = require("strata"),
    Request = strata.Request,
    Builder = strata.Builder,
    redirect = strata.redirect,
    utils = strata.utils;

// This is our simple data store.
var users = {},
    userId = 0;

// A templating function to make a delete button for a user with the given id.
function deleteButton(id) {
    var html = '<form action="/users/' + id + '" method="POST" style="display:inline">';
    html += '<input type="hidden" name="_method" value="DELETE">';
    html += '<button>Delete</button>';
    html += '</form>';

    return html;
}

// Similarly to a Router, the app given to the Builder constructor serves as the
// default app when none of the routes match. We're using a Builder instead of
// a regular Router in this example because it exposes the `use` method that
// allows us to use middleware. Otherwise, it has the same routing methods as
// a Router.
var app = new Builder(function (env, callback) {
    callback(200, {}, 'Try <a href="/users">/users</a>.');
});

// Setup the middleware pipeline.
app.use(strata.commonLogger);
app.use(strata.contentType, "text/html");
app.use(strata.contentLength);
app.use(strata.methodOverride);

// GET /users
// Shows a list of the users currently in the data store and a form for adding
// another to the store.
// Note: app.get(pattern, app) is sugar for app.route(pattern, app, "GET")
app.get("/users", function (env, callback) {
    var content;
    if (utils.isEmptyObject(users)) {
        content = "<p>There are no users!</p>";
    } else {
        content = "<p>The users are:</p>";
        content += "<ul>\n";

        var user;
        for (var id in users) {
            user = users[id];
            content += "<li>"
            content += "Name: " + user.firstName + " " + user.lastName;
            content += ' (<a href="/users/' + id + '">details</a>';
            content += ', ' + deleteButton(id) + ')';
            content += "</li>\n";
        }

        content += "</ul>";
    }

    content += "<p>Create a new user:</p>";
    content += "<p>";
    content += '<form method="post" action="/users">';
    content += '<input type="text" name="first_name" placeholder="first name" width="200">';
    content += '<input type="text" name="last_name" placeholder="last name" width="200">';
    content += '<input type="text" name="username" placeholder="username" width="200">';
    content += '<input type="submit" value="Submit">';
    content += "</form>";
    content += "</p>";

    callback(200, {}, content);
});

// POST /users
// Adds a user to the data store.
// Note: app.post(pattern, app) is sugar for app.route(pattern, app, "POST")
app.post("/users", function (env, callback) {
    var req = new Request(env);

    req.params(function (err, params) {
        if (err && strata.handleError(err, env, callback)) {
            return;
        }

        // Weak validation, but sufficient for the example.
        if (params.first_name && params.last_name && params.username) {
            var id = userId++;
            var user = {
                firstName: params.first_name,
                lastName: params.last_name,
                username: params.username
            };

            users[id] = user;
        }

        // Redirect to /users.
        redirect(env, callback, "/users");
    });
});

// GET /users/:id
// Shows details about the user with the given id.
// Note: app.get(pattern, app) is sugar for app.route(pattern, app, "GET")
app.get("/users/:id", function (env, callback) {
    var id = env.route.id;

    var content;
    if (id in users) {
        var user = users[id];
        content = '<p>Details for user with id "' + id + '":</p>';
        content += "<dl>";
        content += "<dt>First name</dt><dd>" + user.firstName + "</dd>";
        content += "<dt>Last name</dt><dd>" + user.lastName + "</dd>";
        content += "<dt>Username</dt><dd>" + user.username + "</dd>";
        content += "</dl>";
        content += deleteButton(id);
    } else {
        content = '<p>There is no user with id "' + id + '".</p>';
    }

    content += '<p><a href="/users">View all users</a></p>';

    callback(200, {}, content);
});

// DELETE /users/:id
// Deletes the user with the given id.
// Note: app.del(pattern, app) is sugar for app.route(pattern, app, "DELETE")
app.del("/users/:id", function (env, callback) {
    var id = env.route.id;

    if (id in users) {
        delete users[id];
    }

    // Redirect to /users.
    redirect(env, callback, "/users");
});

module.exports = app;
