module.exports = function (app, defaultTimeout, timeoutHandler) {
    return function appWithTimeout(env, callback) {
        env.serverTimeout = defaultTimeout;

        var timer,
            timeoutValue = env.serverTimeout,
            timedOut = false;

        function createTimeout(timeout) {
            timer = setTimeout(function () {
                if (env.serverTimeout === false) {
                    // Timeout was disabled by the app
                    return;
                } else if (env.serverTimeout > timeoutValue) {
                    // Timeout value was increased, so account for this and make
                    // a new timer
                    createTimeout(env.serverTimeout - timeoutValue);
                    timeoutValue = env.serverTimeout;
                } else {
                    // Timeout value was reduced or the same, so error out
                    timedOut = true;
                    timeoutHandler(env, callback);
                }
            }, env.serverTimeout);
        }

        createTimeout(timeoutValue);

        app(env, function () {
            if (!timedOut) {
              clearTimeout(timer);
              callback.apply(this, arguments);
            }
        });
    };
};