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
    redirect = strata.redirect,
    utils = strata.utils,
    view = strata.view;

// This is our simple data store.
var users = {},
    userId = 0;

// Similarly to a Router, the app given to the Builder constructor serves as the
// default app when none of the routes match. We're using a Builder instead of
// a regular Router in this example because it exposes the `use` method that
// allows us to use middleware. Otherwise, it has the same routing methods as
// a Router.
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
    // This would be probably be loaded from a static template file.
    var template = [
        '<% if (isEmptyObject(users)) { %>',
        '<p>There are no users!</p>',
        '<% } else { %>',
        '<p>The users are:</p>',
        '<ul>',
        '<%   for (var id in users) { %>',
        '<%     var user = users[id]; %>',
        '  <li>',
        '  Name: <%= user.firstName %> <%= user.lastName %>',
        '  (<a href="/users/<%= id %>"><%= user.username %></a>)',
        '  <form action="/users/<%= id %>" method="POST" style="display:inline">',
        '    <input type="hidden" name="_method" value="DELETE">',
        '    <button>Delete</button>',
        '  </form>',
        '  </li>',
        '<%   } %>',
        '</ul>',
        '<% } %>',
        '<p>Create a new user:</p>',
        '<p>',
        '<form method="post" action="/users">',
        '<input type="text" name="first_name" placeholder="first name" width="200">',
        '<input type="text" name="last_name" placeholder="last name" width="200">',
        '<input type="text" name="username" placeholder="username" width="200">',
        '<input type="submit" value="Submit">',
        '</form>',
        '</p>'
    ].join("\n");

    var content = view.render(template, {
        users: users,
        isEmptyObject: utils.isEmptyObject
    });

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

            users[id] = {
                firstName: params.first_name,
                lastName: params.last_name,
                username: params.username
            };
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

    // This would be probably be loaded from a static template file.
    var template = [
        '<% if (user) { %>',
        '<p>Details for user with id "<%= id %>":</p>',
        '<dl>',
        '  <dt>First name</dt><dd><%= user.firstName %></dd>',
        '  <dt>Last name</dt><dd><%= user.lastName %></dd>',
        '  <dt>Username</dt><dd><%= user.username %></dd>',
        '</dl>',
        '<form action="/users/<%= id %>" method="POST" style="display:inline">',
        '  <input type="hidden" name="_method" value="DELETE">',
        '  <button>Delete</button>',
        '</form>',
        '<% } else { %>',
        '<p>There is no user with id "<%= id %>".</p>',
        '<% } %>'
    ].join("\n");

    var content = view.render(template, {
        id: id,
        user: users[id]
    });

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

strata.run(app);

/*
As in previous chapters, you can save the above code to a file named `app.js`
and run it with the `node` executable:

    $ node app.js

Then view the app at [http://localhost:1982/](http://localhost:1982/).
*/
