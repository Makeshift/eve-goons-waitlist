const { createLogger, transports, format } = require('winston');
const { combine, timestamp, printf } = format;
const path = require('path');
const fs = require('fs');
const colors = require('colors/safe');

const LOG_DIRECTORY = process.env.LOG_DIRECTORY || 'logs/';
const MAX_LOG_LENGTH = process.env.MAX_LOG_LENGTH || 4000;

const simpleFormat = (info) => {
  return `${info.timestamp} [${info.level}] ${info.message}`;
};

// prints serialized parameters
//  log.info("text", {a: 10}); -> `[info] text {"a":10}`
const extendedFormat = (info) => {
  const extra = {};
  for (let it in info) {
    if (it !== 'timestamp' && it !== 'level' && it !== 'message'
      // additional black-listed attributes
      && it !== 'jse_shortmsg' && it !== 'jse_cause')
      extra[it] = info[it];
  }
  let json = JSON.stringify(extra);
  if (json.length > MAX_LOG_LENGTH) {
    json = json.substr(0, MAX_LOG_LENGTH);
  }
  return `${info.timestamp} [${info.level}] ${info.message} ${json}`;
};

const myColorize = (info) => {
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

    if (Object.keys(info).length === 3) {
    return simpleFormat(info);
  } else {
    return extendedFormat(info);
  }
});
};

const getLogDirectory = () => {
  const logDirectory = path.join(__dirname,LOG_DIRECTORY);
  fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
  return logDirectory;
};

const getWinstonTransports = () => {
  const winstonTransports = [];

  if(process.env.NODE_ENV !== 'production') {
    winstonTransports.push(new transports.Console({
      level: 'debug',
      format: combine(timestamp(), myFormat(true))
    }));
  }

  winstonTransports.push(new transports.File({
    level: 'debug',
    filename: `${getLogDirectory()}/eve-goons-waitlist.log`,
    format: combine(timestamp(), myFormat(false)),
    maxsize: 10000000,
    maxFiles: 10
  }));

  return winstonTransports;
};

const getWinstonExceptionTransports = () => {
  const winstonExceptionTranports = [];
  winstonExceptionTranports.push(new transports.File({
    filename: `${getLogDirectory()}/eve-goons-waitlist-exceptions.log`,
    level: 'silly'
  }));
  return winstonExceptionTranports;
};

const getLabel = (filename) => {
  const fragments = filename.split('/');
  return `${fragments[fragments.length-2]}/${fragments.pop()}`;
};

const logger = createLogger({
  transports: getWinstonTransports(),
  exceptionHandlers: getWinstonExceptionTransports()
});

module.exports = (module) => {
  const filename = getLabel(module.filename);
  return {
    info: (msg, metadata) => logger.info(`[${filename}]: ${msg}`,metadata),
    debug: (msg, metadata) => logger.debug(`[${filename}]: ${msg}`, metadata),
    warn: (msg, metadata) => logger.warn(`[${filename}]: ${msg}`, metadata),
    error: (msg, metadata) => logger.error(`[${filename}]: ${msg}`, metadata)
}
};
