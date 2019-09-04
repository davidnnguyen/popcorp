require('dotenv').config();
const async = require('async');
const fs = require('fs');
const logger = require('./log.js')('env');
const ev = {};

module.exports = function() {

  const exports = {};

  exports.createEnv = function(callback) {
    ev.wrappedFileName = 'wrapped_sym_hpcs.key';

    ev.mongoUser = '';
    ev.mongoPass = '';
    ev.mongoDBUrl = '';

    ev.cmIamUrl = 'https://iam.cloud.ibm.com';
    ev.cmIamApiKey = '';

    ev.kpRootKeyId = '';
    ev.kpUrl = '';
    ev.bluemixInstance = '';


    ev.dek = null;
    ev.kpTokens = {};

    async.series([
      function(cb) {
        let filename = ev.wrappedFileName;
        if (fs.existsSync(filename)) {
          fs.open(filename, 'r', (err, fh) => {
            fs.readFile(fh, 'utf-8', (err, contents) => {
              if (!err) {
                ev.dek = contents;
              } else {
                logger.error(err);
              }
            });
          });
        }
        cb(null);
      },
      function (cb) {
        // connect to key protect?
        cb(null);
      },
      function (cb) {
        // connect to mongo?
        cb(null);
      }
    ], function (error, results) {
      if (!callback) {
        callback = function() {};
      }
      if (error) {
        callback(error, results);
      }
      callback(error, ev);
    });
  };

  exports.getEnv = function() {
    return ev;
  };

  return exports;
};
