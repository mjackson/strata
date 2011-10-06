/*
# Redirects

Web apps often need to redirect the client to some other URL after performing
some task. Another common requirement is for apps to keep track of the URL the
user was trying to access when they were redirected to a login page for
authentication, for example.

Strata uses a simple mechanism that addresses both of these requirements. The
`strata.redirect` module exports a function that will set the proper header and
status code in the response to redirect the user. Use it like this from inside
an app:

    strata.redirect(env, callback, "/login");

The `strata.redirect` module also contains two other functions that help when
storing and retrieving the URL that a user was trying to visit before they were
redirected somewhere else to auth. The first function, `redirect.forward` is
used to record the URL the user is trying to visit in the session before
redirecting them somewhere else to auth. Then, after the user has a valid
session you can use `redirect.back` to seamlessly redirect them back to the URL
they were trying to get to in the first place.

Note: This isn't the only scenario in which you can use this mechanism, it's
just the most common. Also note that in order for forwarding to work properly,
you must be using sessions.

The app below uses this mechanism to restrict access to "/". When a user tries
to visit "/" without a valid session, they are redirected to "/login" to auth.
Once they auth, they can view the "restricted" content. Notice how in the call
to `redirect.back` we don't specify a path to redirect the user back to. The
correct path is tracked for us automatically in the session.
*/

var strata = require("strata"),
    redirect = strata.redirect;

var app = new strata.Builder;

app.use(strata.commonLogger);
app.use(strata.contentType);
app.use(strata.contentLength);
app.use(strata.sessionCookie);

// GET /
// The "restricted" section of the app. Requires a user to login before they
// can view it.
app.get("/", function (env, callback) {
    if (env.session.loggedIn) {
        var content = [
            '<p>You can now access the restricted section!</p>',
            '<p><a href="/logout">Logout</a></p>'
        ].join("\n");

        callback(200, {}, content);
    } else {
        // This call stores the current request URL in the session and redirects
        // the user to /login for auth.
        redirect.forward(env, callback, "/login");
    }
});

// GET /login
// Shows the login form.
app.get("/login", function (env, callback) {
    var content = [
        '<p>You are trying to view a restricted page. Please login.</p>',
        '<form action="/login" method="post">',
        '<button>Login</button>',
        '</form>'
    ].join("\n");

    callback(200, {}, content);
});

// POST /login
// Sets the loggedIn session variable and redirects the user to the URL they
// were trying to access before they were sent to /login.
app.post("/login", function (env, callback) {
    env.session.loggedIn = 1;

    // This call sends the user back to wherever they were before they were
    // sent to /login for auth using redirect.forward.
    redirect.back(env, callback);
});

// GET /logout
// Clears the session.
app.get("/logout", function (env, callback) {
    env.session = {};
    redirect(env, callback, "/");
});

strata.run(app);

/*
As in previous chapters, you can save the above code to a file named `app.js`
and run it with the `node` executable:

    $ node app.js

Then view the app at [http://localhost:1982/](http://localhost:1982/).
*/
