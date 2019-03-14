"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("./config");
exports.levels = [
    'debug',
    'info',
    'warn',
    'error',
    'none'
];
var levelToInt = {};
var intToLevel = {};
for (var index = 0; index < exports.levels.length; index++) {
    var level = exports.levels[index];
    levelToInt[level] = index;
    intToLevel[index] = level;
}
/**
* @ignore
*/
var Logger = /** @class */ (function () {
    function Logger() {
    }
    Logger.error = function (message) {
        if (!this.shouldLog('error'))
            return;
        console.error(this.logMessage('error', message));
    };
    Logger.warn = function (message) {
        if (!this.shouldLog('warn'))
            return;
        console.warn(this.logMessage('warn', message));
    };
    Logger.info = function (message) {
        if (!this.shouldLog('info'))
            return;
        console.log(this.logMessage('info', message));
    };
    Logger.debug = function (message) {
        if (!this.shouldLog('debug'))
            return;
        console.log(this.logMessage('debug', message));
    };
    Logger.logMessage = function (level, message) {
        return "[" + level.toUpperCase() + "] " + message;
    };
    Logger.shouldLog = function (level) {
        var currentLevel = levelToInt[config_1.config.logLevel];
        return currentLevel <= levelToInt[level];
    };
    return Logger;
}());
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map