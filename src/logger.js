const { createLogger, transports, format } = require('winston');

const { combine, timestamp, printf } = format;
const path = require('path');
const fs = require('fs');
const colors = require('colors/safe');

const LOG_DIRECTORY = process.env.LOG_DIRECTORY || '../logs/';
const MAX_LOG_LENGTH = process.env.MAX_LOG_LENGTH || 4000;

const simpleFormat = info => `${info.timestamp} [${info.level}] ${info.message}`;

// prints serialized parameters
//  log.info("text", {a: 10}); -> `[info] text {"a":10}`
const extendedFormat = (info) => {
  const extra = {};
  const unwantedElements = ['timestamp', 'level', 'message', 'jse_shortmsg', 'jse_cause'];
  Object.keys(info).filter(entry => unwantedElements.indexOf(entry) < 0).forEach(entry => (extra[entry] = info[entry]));
  let json = JSON.stringify(extra);
  if (json.length > MAX_LOG_LENGTH) {
    json = json.substr(0, MAX_LOG_LENGTH);
  }
  return `${info.timestamp} [${info.level}] ${info.message} ${json}`;
};

const myColorize = (level, message) => {
  switch (level) {
    case 'warn': return colors.yellow(message);
    case 'error': return colors.bgRed(message);
    case 'debug': return colors.gray(message);
    default: return message;
  }
};

const myFormat = colorize => printf((info) => {
  if (colorize) {
    // eslint-disable-next-line no-param-reassign
    info.message = myColorize(info.level, info.message);
  }

  if (Object.keys(info).length === 3) {
    return simpleFormat(info);
  }
  return extendedFormat(info);
});

const getLogDirectory = () => {
  const logDirectory = path.join(__dirname, LOG_DIRECTORY);
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
  }
  return logDirectory;
};

const getWinstonTransports = () => {
  const winstonTransports = [];

  if (process.env.NODE_ENV !== 'production') {
    winstonTransports.push(new transports.Console({
      level: 'debug',
      format: combine(timestamp(), myFormat(true)),
      handleExceptions: true
    }));
  }

  winstonTransports.push(new transports.File({
    level: 'debug',
    filename: `${getLogDirectory()}/eve-goons-waitlist.log`,
    format: combine(timestamp(), myFormat(false)),
    maxsize: 10000000,
    maxFiles: 10,
    handleExceptions: true
  }));

  return winstonTransports;
};

const getWinstonExceptionTransports = () => {
  const winstonExceptionTranports = [];
  winstonExceptionTranports.push(new transports.File({
    filename: `${getLogDirectory()}/eve-goons-waitlist-exceptions.log`,
    level: 'silly',
    handleExceptions: true
  }));
  return winstonExceptionTranports;
};

const getLabel = (filename) => {
  const fragments = filename.split('/');
  return `${fragments[fragments.length - 2]}/${fragments.pop()}`;
};

const logger = createLogger({
  transports: getWinstonTransports(),
  exceptionHandlers: getWinstonExceptionTransports()
});

module.exports = (module) => {
  const filename = getLabel(module.filename);
  return {
    info: (msg, metadata) => logger.info(`[${filename}]: ${msg}`, metadata),
    debug: (msg, metadata) => logger.debug(`[${filename}]: ${msg}`, metadata),
    warn: (msg, metadata) => logger.warn(`[${filename}]: ${msg}`, metadata),
    error: (msg, metadata) => logger.error(`[${filename}]: ${msg}`, metadata)
  };
};
