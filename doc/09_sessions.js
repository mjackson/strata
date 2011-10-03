/*
# Sessions

Strata provides persistence across HTTP requests (sessions) via the use of
cookies. There are pros and cons to this technique that this chapter won't
attempt to explain. Instead, we'll just provide a few tips and give an example
of how to use them in Strata.

## Guidelines

It is wise to keep as little information in the session cookie as possible.
There are several reasons for this, but the main two are:

  - A cookie may not exceed 4k in size so any data that exceeds that limit will
    be dropped
  - It can be a headache to synchronize data that is stored in a cookie with
    data that is stored on the server

If you are careful with the data you store in the session, you will find that 4k
of data is more than enough to work with.

## Usage

Session cookies are enabled through the use of the `strata.sessionCookie`
middleware. You use it like this:

    strata.sessionCookie(app, options);

When using this middleware, the second parameter is an object of options that
let you customize its behavior. Valid options are:

  - `secret`        A secret string to use to verify the cookie's contents,
                    defaults to `null`. If this is set the session's contents
                    will be cleared if the cookie has been tampered with
  - `name`          The name of the cookie, defaults to "strata.session"
  - `path`          The path of the cookie, defaults to "/"
  - `domain`        The cookie's domain, defaults to `null`
  - `expireAfter`   A number of seconds after which this cookie will expire,
                    defaults to `null`
  - `secure`        True to only send this cookie over HTTPS, defaults to `false`
  - `httpOnly`      True to only send this cookie over HTTP, defaults to `true`

The app below demonstrates how a session might be used to track the id of the
currently logged in user.
*/

var strata = require("strata"),
    redirect = strata.redirect;

var app = new strata.Builder;

app.use(strata.commonLogger);
app.use(strata.contentType, "text/html");
app.use(strata.contentLength);
app.use(strata.sessionCookie, {
    secret: "my s3kret",
    name: "myapp.session"
});

// GET /login
// Sets a userId variable in the session that lets us know the user
// is logged in.
app.get("/login", function (env, callback) {
    env.session.userId = "1";
    redirect(env, callback, "/");
});

// GET /logout
// Clears the session and redirects to /.
app.get("/logout", function (env, callback) {
    env.session = {};
    redirect(env, callback, "/");
});

app.run(function (env, callback) {
    var session = env.session;

    var content;
    if (session.userId) {
        content = 'You are logged in. <a href="/logout">Click here</a> to log out.';
    } else {
        content = 'You are logged out. <a href="/login">Click here</a> to log in.';
    }

    callback(200, {}, content);
});

strata.run(app);

/*
As in previous chapters, you can save the above code to a file named `app.js`
and run it with the `node` executable:

    $ node app.js

Then view the app at [http://localhost:1982/](http://localhost:1982/).
*/
