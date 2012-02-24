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

// Define some templates. These would normally be stored in template files.
var loggedInTemplate = [
    '<p>You are now logged in!</p>',
    '<p><a href="/logout">Logout</a></p>'
].join("\n");

var loggedOutTemplate = [
    '<p>Please login.</p>',
    '<form action="/login" method="post">',
    '<button>Login</button>',
    '</form>'
].join("\n");

strata.use(strata.commonLogger);
strata.use(strata.contentType, "text/html");
strata.use(strata.contentLength);
strata.use(strata.sessionCookie);

// The "restricted" section of the app. Requires a user to login before they
// can view it.
strata.get("/", function (env, callback) {
    if (env.session.loggedIn) {
        callback(200, {}, loggedInTemplate);
    } else {
        // This call stores the current request URL in the session and redirects
        // the user to /login for auth.
        redirect.forward(env, callback, "/login");
    }
});

// Shows the login form.
strata.get("/login", function (env, callback) {
    callback(200, {}, loggedOutTemplate);
});

// Sets the loggedIn session variable and redirects the user to the URL they
// were trying to access before they were sent to /login.
strata.post("/login", function (env, callback) {
    env.session.loggedIn = 1;

    // This call sends the user back to wherever they were before they were
    // sent to /login for auth using redirect.forward.
    redirect.back(env, callback);
});

// Clears the session.
strata.get("/logout", function (env, callback) {
    env.session = {};
    redirect(env, callback, "/");
});

strata.run();

/*
As in previous chapters, you can save the above code to a file named `app.js`
and run it with the `node` executable:

    $ node app.js

Then view the app at [http://localhost:1982/](http://localhost:1982/).
*/
