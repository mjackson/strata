var strata = require("./index");

process.on("message", function (message, serverHandle) {
    if (!serverHandle) {
        return;
    }

    var appFile = message.appFile;
    var options = message.options;

    // Don't spawn a child inside a child.
    delete options.interval;

    // Use the server handle from the parent process.
    options.socket = serverHandle;

    // Force the child to be quiet.
    options.quiet = true;

    strata.runFile(appFile, options, function () {
        process.send({ready: true});
    });
});
