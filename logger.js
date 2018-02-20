

const path = require('path');

const setup = require('./setup.js');
const winston = require('winston');
const { combine, timestamp, printf } = winston.format;

// init
(function () {

	const dir = setup.logging ? setup.logging.dir : __dirname;

	const simpleFormat = (info) => {
		return `${info.timestamp} [${info.level}] ${info.message}`;
	};

	// adds serialized parameters
	//  log.info("text", {a: 10});
	//  -> `[info] text {"a":10}`
	const extendedFormat = (info) => {
		var extra = {};
		for (var it in info) {
			if (it !== 'timestamp' && it !== 'level' && it !== 'message')
				extra[it] = info[it];
		}
		return `${info.timestamp} [${info.level}] ${info.message} ${JSON.stringify(extra)}`;
	};

	const myFormat = printf(info => {
		if (Object.keys(info).length == 3) {
			return simpleFormat(info);
		}
		else {
			return extendedFormat(info);
		}
	});

	winston.loggers.add('core', {
		format: combine(timestamp(), myFormat),
		transports: [
			new winston.transports.Console(),
			new winston.transports.File({ filename: path.normalize(dir + '/log.txt') })
		],
		// app crashes are logged to separated file
		exceptionHandlers: [
			new winston.transports.File({ filename: path.normalize(dir + '/exceptions.txt') })
		],
	});

	winston.loggers.get('core').info("logging started");

})();

// export
module.exports = {

	// @ES6 rest parameters: http://exploringjs.com/es6/ch_core-features.html#sec_from-arguments-to-rest
	info: function (...args) {
		// @ES6 spread operator http://exploringjs.com/es6/ch_core-features.html#sec_from-apply-to-spread
		winston.loggers.get('core').info(...args);
	},

};
