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
URL up to a `.`, `/`, `?`, or `#`.

The second method is to use a pure regular expression. This method provides
you with the most fine-grained control over the matching behavior of the
pattern.

When a pattern matches the URL, the results of the match are stored in the
`route` environment variable. This variable contains the original string that
matched as well as any captures that were present in the pattern. It also has
getter/setter properties for any segments of the URL that were defined as
symbols. The example below expands upon the example in the previous chapter and
adds support for viewing and deleting a user with a particular id.

Note: This example uses [Mustache](https://github.com/janl/mustache.js) for
template rendering. To install it, use `npm install mustache`.
*/

var strata = require("strata"),
    redirect = strata.redirect,
    mustache = require("mustache");

// This is our simple data store.
var users = {},
    userId = 0;

// Define some templates. These would normally be stored in template files.
var userListTemplate = [
    '{{^users}}',
    '<p>There are no users!</p>',
    '{{/users}}',
    '{{#hasUsers}}',
    '<p>The users are:</p>',
    '<ul>',
    '{{#users}}',
    '  <li>',
    '  Name: {{firstName}} {{lastName}}',
    '  (<a href="/users/{{id}}">{{username}}</a>)',
    '  <form action="/users/{{id}}" method="POST" style="display:inline">',
    '    <input type="hidden" name="_method" value="DELETE">',
    '    <button>Delete</button>',
    '  </form>',
    '  </li>',
    '{{/users}}',
    '</ul>',
    '{{/hasUsers}}',
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

var userDetailTemplate = [
    '{{^user}}',
    '<p>There is no user with id "{{id}}".</p>',
    '{{/user}}',
    '{{#user}}',
    '<p>Details for user with id "{{id}}":</p>',
    '<dl>',
    '  <dt>First name</dt><dd>{{firstName}}</dd>',
    '  <dt>Last name</dt><dd>{{lastName}}</dd>',
    '  <dt>Username</dt><dd>{{username}}</dd>',
    '</dl>',
    '<form action="/users/{{id}}" method="POST" style="display:inline">',
    '  <input type="hidden" name="_method" value="DELETE">',
    '  <button>Delete</button>',
    '</form>',
    '{{/user}}'
].join("\n");

strata.use(strata.commonLogger);
strata.use(strata.contentType, "text/html");
strata.use(strata.contentLength);
strata.use(strata.methodOverride);

// Shows a list of the users currently in the data store and a form for adding
// another to the store.
strata.get("/users", function (env, callback) {
    var userList = [];

    for (var id in users) {
        userList.push(users[id]);
    }

    var content = mustache.to_html(userListTemplate, {
        hasUsers: userList.length != 0,
        users: userList
    });

    callback(200, {}, content);
});

// Adds a user to the data store.
strata.post("/users", function (env, callback) {
    var req = new strata.Request(env);

    req.params(function (err, params) {
        if (err && strata.handleError(err, env, callback)) {
            return;
        }

        // Weak validation, but sufficient for the example.
        if (params.first_name && params.last_name && params.username) {
            var id = userId++;

            users[id] = {
                id: id,
                firstName: params.first_name,
                lastName: params.last_name,
                username: params.username
            };
        }

        // Redirect to /users.
        redirect(env, callback, "/users");
    });
});

// Shows details about the user with the given id.
strata.get("/users/:id", function (env, callback) {
    var id = env.route.id;
    var content = mustache.to_html(userDetailTemplate, {
        id: id,
        user: users[id]
    });

    callback(200, {}, content);
});

// Deletes the user with the given id (uses DELETE HTTP verb).
strata.delete("/users/:id", function (env, callback) {
    var id = env.route.id;

    if (id in users) {
        delete users[id];
    }

    // Redirect to /users.
    redirect(env, callback, "/users");
});

strata.run(function (env, callback) {
    callback(200, {}, 'Try <a href="/users">/users</a>.');
});

/*
As in previous chapters, you can save the above code to a file named `app.js`
and run it with the `node` executable:

    $ node app.js

Then view the app at [http://localhost:1982/](http://localhost:1982/).
*/
