/*
# File Uploads

Strata ships with built-in support for handling file uploads. It borrows the
extremely fast parser from [node-formidable](https://github.com/felixge/node-formidable)
and uses a custom API that makes it easy to work with file uploads within the
context of the rest of the framework.

The basic pattern for an app that handles file uploads by streaming them to disk
looks like this:

    var strata = require("strata"),
        multipart = strata.multipart;

    strata.run(function (env, callback) {
        var req = strata.Request(env);

        req.params(function (err, params) {
            for (var name in params) {
                if (params[name] instanceof multipart.File) {
                    // It's a multipart.File object.
                } else {
                    // It's a string.
                }
            }
        });
    });

In this example you can see that Strata normalizes access to file uploads using
the familiar `req.params` API. In other words, file uploads are treated just
like any other request parameter, except that the value is a `multipart.File`
object instead of a string.

These objects have the following properties:

  - `path`      The full path to the temporary file on disk
  - `type`      The Content-Type of the file
  - `name`      The name of the file as indicated in the Content-Disposition
                header
  - `size`      The size of the file in bytes

The app below demonstrates how you might build a simple form to upload an image.
*/

var strata = require("strata"),
    multipart = strata.multipart;

strata.use(strata.commonLogger);
strata.use(strata.contentType);
strata.use(strata.contentLength);

// Shows a form for making a file upload.
strata.get("/", function (env, callback) {
    var content = "";

    content += '<form action="/" method="post" enctype="multipart/form-data">';
    content += '<input name="photo" type="file">';
    content += '<input type="submit" value="Upload">';
    content += '</form>';

    callback(200, {}, content);
});

// Uploads a file to the server.
strata.post("/", function (env, callback) {
    var req = strata.Request(env);

    req.params(function (err, params) {
        if (err && strata.handleError(err, env, callback)) {
            return;
        }

        var photo = params.photo;

        // Do some simple validation.
        if (!photo) {
            callback(403, {}, 'Param "photo" is required');
        } else if (!(photo instanceof multipart.File)) {
            callback(403, {}, 'Param "photo" must be a file upload');
        } else if (!(/image\//).test(photo.type)) {
            callback(403, {}, 'Param "photo" must be an image');
        } else {
            var content = "";

            content += "The photo was uploaded successfully. Here are its properties:";
            content += "<ul>";

            ["path", "name", "type", "size"].forEach(function (prop) {
                content += "<li>" + prop + ": " + photo[prop] + "</li>";
            });

            content += "</ul>";

            callback(200, {}, content);
        }
    });
});

strata.run();

/*
As in previous chapters, you can save the above code to a file named `app.js`
and run it with the `node` executable:

    $ node app.js

Then view the app at [http://localhost:1982/](http://localhost:1982/).
*/
