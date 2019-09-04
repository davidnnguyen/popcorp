/*
 * Licensed Materials - Property of IBM
 *
 * OCO Source Materials
 *
 * (C) Copyright IBM Corp. 2018 All Rights Reserved
 *
 * The source code for this program is not published or other-
 * wise divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */
const util = require('util');
const {config, createLogger, format, transports} = require('winston');
const {combine, timestamp, printf} = format;

const _buildMessage = function(packageName, args) {
  let s = '';
  for (let i=0; i<args.length; i++) {
    if (typeof args[i] === 'string') {
      s = s.concat(' ' + args[i]);
    } else {
      s = s.concat(' ' + util.inspect(args[i]));
    }
  }
  return {
    package: packageName,
    message: s
  };
};

module.exports = function(name) {
  const exports = {};

  exports._packageName = name;

  exports._logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels: config.npm.levels,
    format: combine(
      format.align(),
      timestamp(),
      printf(info =>
        `${info.timestamp} [${info.package}] ${info.level}: ${info.message}`)
    ),
    transports: [
      new transports.Console()
    ]
  });

  exports.error = function() {
    this._logger.error(_buildMessage(this._packageName, arguments));
  };

  exports.warn = function() {
    this._logger.warn(_buildMessage(this._packageName, arguments));
  };

  exports.info = function() {
    this._logger.info(_buildMessage(this._packageName, arguments));
  };

  exports.verbose = function() {
    this._logger.verbose(_buildMessage(this._packageName, arguments));
  };

  exports.debug = function() {
    this._logger.debug(_buildMessage(this._packageName, arguments));
  };

  exports.silly = function() {
    this._logger.silly(_buildMessage(this._packageName, arguments));
  };

  exports.write = function(message) {
    this._logger.info(_buildMessage(this._packageName, message.trim()));
  };

  return exports;
};

