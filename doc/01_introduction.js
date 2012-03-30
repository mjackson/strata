/*
# Introduction

Welcome to Strata!

[Strata](http://stratajs.org) is a streaming HTTP server for
[node.js](http://nodejs.org) that is patterned after time-honored web server
design principles pioneered in the [Python](http://python.org/) and
[Ruby](http://ruby-lang.org) communities, namely [WSGI](http://wsgi.org/wsgi/)
and [Rack](http://rack.rubyforge.org/). Using Strata, developers can build
highly performant web servers in a powerful, modular style that is easy to
maintain and takes full advantage of the streaming capabilities and excellent
I/O handling of node.js.

The goal of this manual is to introduce you to the Strata web server in a way
that will help you get started quickly by providing clear, concise explanations
and example code. At the same time, the manual provides detailed descriptions of
various components of the framework so that you're not left wondering how things
actually work behind the scenes.

The manual is designed to be read linearly. Earlier chapters cover the basic
principles you should understand before proceeding to later chapters, so you
should start with them if you're having trouble understanding more advanced
concepts.

## Style Conventions

The following style conventions are used throughout this manual when referring
to code:

  - A dot is used to denote a property of an object. For example, `req.params`
    has reference to the `params` property of the `req` object.
  - A hash is used to denote a property of an object's *prototype*. For example,
    `Request#params` has reference to `Request.prototype.params`. Basically, you
    can substitute `.prototype.` for a `#`.

## Installation

Strata is a web framework for [node.js](http://nodejs.org). So, to install and
use Strata you first need to install node and [npm](http://npmjs.org/) (node's
package manager). Detailed instructions about how to do this are available
[on the node.js wiki](https://github.com/joyent/node/wiki/Installation).

Once you've installed npm, you can use it to install Strata:

    $ npm install strata

## Your First Application

Now that you've installed Strata, copy and paste the code below into a file
named `app.js`.
*/

var strata = require("strata");

strata.use(strata.commonLogger);
strata.use(strata.contentType, "text/plain");
strata.use(strata.contentLength);

strata.get("/", function (env, callback) {
    callback(200, {}, "Hello world!");
});

strata.run();

/*
You can run the file using the `node` executable:

    $ node app.js

Now visit the app at [http://localhost:1982/](http://localhost:1982/).

Congratulations! You just ran your first Strata app complete with middleware,
logging, and custom routing capabilities. Continue reading the next chapter to
understand more about what's going on in the example above.
*/
