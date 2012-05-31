/*
# Rewriting URLs

Occasionally your app may need to rewrite an incoming URL to be something else.
For example, you may want to rewrite all requests for `/oldpage.html` to
`newpage.html` without sending the client a full-blown redirect to the new
content.

The `strata.rewrite` middleware can perform this function for you. Given the
scenario above, you might use it like this:

    strata.rewrite(app, "/oldpage.html", "/newpage.html");

Similar to Apache's [mod_rewrite](http://httpd.apache.org/docs/current/mod/mod_rewrite.html),
`strata.rewrite` simply takes a regular expression (or a string) to match
against the value of the environment's `pathInfo` and a replacement string. If
the expression matches, the `pathInfo` is rewritten for all downstream apps with
the replacement value using a simple [String#replace](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String/replace).

## Nginx Rewrite Example

If you've used the [nginx](http://nginx.net/) web server before as a reverse
proxy, you may have used a rewrite directive similar the following in your
`nginx.conf`:

    if (-f $request_filename.html) {
      rewrite (.*) $1.html break;
    }

Basically, what this directive is saying is that if there is a file that exists
on disk with the same name as the file name that was given in the request URL
plus ".html", then rewrite the request to serve that file. This is a very common
type of rewrite to perform that lets clients leave off the ".html" suffix when
requesting HTML files. It also has other uses that are outside the scope of this
chapter.

The example app below performs the same function in Strata.
*/

var path = require("path"),
    strata = require("strata");

// For the sake of this example, the root directory where we store static files
// is the current working directory (i.e. $PWD).
var root = path.resolve(".");

// This middleware checks for a file in the given `root` directory that has an
// ".html" suffix but otherwise corresponds to the path given in the URL.
function checkHtml(app, root) {
    return function (env, callback) {
        var pathInfo = env.pathInfo;

        // Check to see if an .html version of the requested file exists.
        path.exists(path.join(root, pathInfo) + ".html", function (exists) {
            if (exists) {
                // Rewrite env.pathInfo for downstream apps.
                env.pathInfo = pathInfo + ".html";
            }

            app(env, function (status, headers, body) {
                // Reset the value of pathInfo for upstream apps.
                env.pathInfo = pathInfo;
                callback(status, headers, body);
            });
        });
    }
}

strata.use(strata.commonLogger);
strata.use(checkHtml, root); // Check for .html in front of a static file server.
strata.use(strata.file, root);

strata.run();

/*
As in previous chapters, you can save the above code to a file named `app.js`
and run it with the `node` executable:

    $ node app.js

Make sure you run that command from a directory where you also have another file
named `index.html`. Then view that file at [http://localhost:1982/index](http://localhost:1982/index).
*/
