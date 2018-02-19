
const path = require('path');
const setup = require('./setup.js');
const { loggers, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

const dir = setup.logging ? setup.logging.dir : __dirname;


const myFormat = printf(info => {
	return `${info.timestamp} [${info.level}] ${info.message}`;
});

loggers.add('core', {
	format: combine(
		timestamp(),
		myFormat,
	),
	transports: [
		new transports.Console(),
		new transports.File({ filename: path.normalize(dir+'/log.txt') })
	],
	// app crashes are logged to separated file
	exceptionHandlers: [
		new transports.File({ filename: path.normalize(dir +'/exceptions.txt') })
	],
});