// Sometimes you need to be able to capture certain segments of the URL to use
// in your application logic. For example, in a traditional REST app you might
// have a URL that looks like "/users/:id" where the `:id` portion may be any
// valid user id. Strata supports two similar routing mechanisms that allow you
// to retrieve this data.
//
// The first is to use a Ruby-like symbol notation, as is common in the Rails
// and Sinatra web frameworks. Strata recognizes any sequence of a colon
// followed by an alpha character and any number of alpha-numeric characters or
// underscores as one of these symbols. They match any non-empty sequence of
// characters in the URL up to a "/", "?", or "#".
//
// The second method is to use a pure regular expression. This method provides
// you with the most fine-grained control over the matching behavior of the
// pattern.
//
// The way you retrieve segments of the URL that matched is through the
// `strata.route` environment variable. This variable is an array that contains
// the result of the match, including any captures. In the case of routes that
// were defined as a named symbol, it also has getter/setter properties with the
// same name as that symbol (minus the leading colon).

var strata = require("./../lib"),
    redirect = strata.redirect;
    utils = strata.utils;

var users = {},
    userId = 0;

// Make a delete button for a user with the given id.
function deleteButton(id) {
    var html = '<form action="/users/' + id + '" method="POST" style="display:inline">';
    html += '<input type="hidden" name="_method" value="DELETE">';
    html += '<button>Delete</button>';
    html += '</form>';

    return html;
}

// Similarly to a Router, the app given to the Builder constructor serves as the
// default app when none of the routes match. We're using a Builder instead of
// a regular Router in this example because we'd like to use some middleware.
var app = new strata.Builder(function (env, callback) {
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
    var req = new strata.Request(env);

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
    var route = env["strata.route"];
    var id = route.id;

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
    var route = env["strata.route"];
    var id = route.id;

    if (id in users) {
        delete users[id];
    }

    // Redirect to /users.
    redirect(env, callback, "/users");
});

module.exports = app;
