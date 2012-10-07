[![build status](https://secure.travis-ci.org/mjijackson/strata.png)](http://travis-ci.org/mjijackson/strata)

Strata is a streaming HTTP server for node.js that is patterned after time-honored web server design principles pioneered in the Python and Ruby communities, namely [WSGI](http://www.wsgi.org/) and [Rack](http://rack.rubyforge.org/). Using Strata, developers can build highly performant web servers in a powerful, modular style that is easy to maintain and takes full advantage of the streaming capabilities and excellent I/O handling of node.js.

The core Strata distribution consists of four things:

  - A specification (see SPEC) for building applications and middleware
  - A library (see lib) with many useful utilities and middleware to aid
    developers in the common tasks of building applications that conform to
    the specification
  - An executable (see bin/strata) for running Strata applications from the
    command line
  - A user manual (see doc) that contains detailed documentation and code
    examples

## Installation

Install Strata using [npm](http://npmjs.org/):

    $ npm install strata

You are also free to [browse or download the source](https://github.com/mjijackson/strata).

## Usage

The simplest possible Strata app looks like this:

``` javascript
function app(env, callback) {
  callback(200, {}, "Hello world!");
}

require("strata").run(app);
```

As you can see from the example above, a Strata "app" is simply a JavaScript function that accepts two arguments: the server environment and a callback. The environment contains all sorts of information about the current request including headers, POST and session data, and much more. The callback is used to send the response. You can read much more about both the environment and the callback in the [SPEC](https://raw.github.com/mjijackson/strata/master/SPEC).

A slightly more complex application might look something like the following:

``` javascript
var strata = require('strata');

strata.use(strata.commonLogger); // Log requests to the console
strata.use(strata.file, '/path/to/public'); // Serve static files in /path/to/public
strata.use(strata.contentType, 'text/html'); // Default Content-Type to text/html
strata.use(strata.contentLength); // Set the Content-Length automatically
strata.use(strata.sessionCookie, { // Enable cookie-based sessions
  secret: 'session secret string' // Set a session secret for security
});

strata.get('/', function (env, callback) {
  callback(200, {}, 'Hello anonymous!');
});

strata.get('/:username', function (env, callback) {
  var route = env.route;
  callback(200, {}, 'Hello ' + route.username + '!');
});

// Start the server on port 3000
strata.run({ port: 3000 });
```

There are many more usage examples in the [Strata user manual](http://stratajs.org/manual).

## Documentation

The [Strata user manual](http://stratajs.org/manual) is designed to teach you how to get up and running with the framework as quickly as possible. Each chapter of the manual contains documentation about a certain feature of the framework and a code example.

The manual is written in such a way that the topics and examples discussed in higher numbered chapters build upon previous ones. Thus, it is recommended to start with lower numbered chapters when getting started and work your way up to higher ones.

The user manual refers to the [SPEC](https://raw.github.com/mjijackson/strata/master/SPEC) in various places. This document is the canonical reference for the key building blocks of the framework including applications, callbacks, and the Strata environment.

## Tests

The test directory contains a comprehensive suite of unit tests for Strata. Use [mocha](http://visionmedia.github.com/mocha/) to run them all:

    $ mocha test/*-test.js

Or run the tests for a specific module:

    $ mocha test/utils-test.js

## License

Copyright 2012 Michael Jackson

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

The software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and non-infringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.

## Acknowledgements

Strata was inspired by similar efforts in the Python and Ruby communities, namely [WSGI](http://www.wsgi.org/) and [Rack](http://rack.rubyforge.org/). It borrows many code patterns from these libraries, as well as the [JSGI](http://jackjs.org/jsgi-spec.html) project.

Strata's multipart parser is based on the fast parser in the node-formidable project written by Felix Geisendörfer. It is included in Strata under the terms of the MIT license.

My sincere thanks to the authors of each of these libraries for the excellent work they've done and graciously shared.
