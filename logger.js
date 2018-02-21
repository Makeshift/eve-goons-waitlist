
const path = require('path');
const setup = require('./setup.js');
const winston = require('winston');
const { combine, timestamp, printf } = winston.format;
var colors = require('colors/safe');

// init
(function () {

	const MAX_JSON_MSG_LEN = 4000;
	const MAX_FILE_SIZE = 1024 * 1024 * 50;
	const dir = setup.logging ? setup.logging.dir : __dirname;

	const simpleFormat = (info) => {
		return `${info.timestamp} [${info.level}] ${info.message}`;
	};

	// prints serialized parameters
	//  log.info("text", {a: 10}); -> `[info] text {"a":10}`
	
	const extendedFormat = (info) => {
		var extra = {};
		for (var it in info) {
			if (it !== 'timestamp' && it !== 'level' && it !== 'message')
				extra[it] = info[it];
		}
		var json = JSON.stringify(extra);
		if (json.length > MAX_JSON_MSG_LEN) json = json.substr(0, MAX_JSON_MSG_LEN);
		return `${info.timestamp} [${info.level}] ${info.message} ${json}`;
	};

	const myColorize = (info) => {
		// @colors/safe https://www.npmjs.com/package/colors
		switch (info.level) {
			case 'warn': info.message = colors.yellow(info.message);
				break;
			case 'error': info.message = colors.bgRed(info.message);
				break;
			case 'debug': info.message = colors.gray(info.message);
				break;
		}
	};

	const myFormat = (colorize) => {
		return printf(info => {
			if (colorize) {
				myColorize(info);
			}

			if (Object.keys(info).length == 3) {
				return simpleFormat(info);
			}
			else {
				return extendedFormat(info);
			}
		});
	};

	winston.loggers.add('core', {
		transports: [
			new winston.transports.Console({
				level: 'debug',
				format: combine(timestamp(), myFormat(true)),
			}),
			new winston.transports.File({
				level: 'debug',
				filename: path.normalize(dir + '/log.txt'),
				format: combine(timestamp(), myFormat(false)),
				maxsize: MAX_FILE_SIZE
			})
		],
		// app-crashes are logged to separated file
		exceptionHandlers: [
			new winston.transports.File({ filename: path.normalize(dir + '/exceptions.txt') })
		],
	});

	winston.loggers.get('core').info("logging started");

})();

const logger = winston.loggers.get('core');

// export
module.exports = {

	// @ES6 rest parameters: http://exploringjs.com/es6/ch_core-features.html#sec_from-arguments-to-rest
	info: function (...args) {
		// @ES6 spread operator http://exploringjs.com/es6/ch_core-features.html#sec_from-apply-to-spread
		logger.info(...args);
	},

	debug: function (...args) {
		logger.debug(...args);
	},

	warn: function(...args) {
		logger.warn(...args);
	},
	
	error: function (...args) {
		logger.error(...args);
	},

};
