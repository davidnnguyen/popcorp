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
const request = require('request');
const fs = require('fs');
const tokenManager = require('./iam-token-manager.js')();
const ev = require('../env.js')().getEnv();
const logger = require('../log.js')('utils.dekFunctions');

module.exports = function () {
  let exports = {};

  exports.doGet = function(kpPath, msgStr, callback) {
    logger.info('doGet called');
  };

  exports.doPost = function(kpPath, formData, msgStr, callback) {
    tokenManager.getToken(ev.kpUrl, (err, token) => {
      logger.info(token);
      if (err) {
        logger.info('Error getting token for ' + ev.kpUrl + ' - ' + err, true);
        callback(401, {error: 'Error getting token for authenticating to:  ' + ev.kpUrl});
      } else {
        let options = exports._createRequest(token, 'POST', kpPath, formData);
        options.gzip = true;
        request(options, (err, resp, body) => {
          let errMsg = 'Error getting ' + msgStr + ' for ' + kpPath;
          if (err) {
            if (err.code) {
              logger.info(errMsg + ' - ' + err + ' - ' + err.code, true);
            } else {
              logger.info(errMsg + ' - ' + err, true);
            }
            callback(500, {error: errMsg});
          } else {
            if (resp.statusCode >= 400) {
              if (body) {
                //logger.info(errMsg + ' >> ' + JSON.stringify(body), true);
                callback(resp.statusCode, {error: body});
              } else {
                logger.info(errMsg);
                callback(resp.statusCode, {error: errMsg});
              }
            } else {
              //limit log message to 90 characters
              logger.info(msgStr + ' for LPAR ' + kpPath + ' >> ' +
                JSON.stringify(body).toString().substring(0, 90));
              callback(null, body);
            }
          }
        });
      }
    });
  };

  /* unwraps a DEK and returns the base64 encoded value in result */
  exports.unwrapDEK = function(callback) {
    let dek = null;

    logger.info('unwrapDEK: ev.dek: ' + ev.dek);
    if (ev.dek == null) {
      callback(500, 'DEK does not exist');
    }

    let formData = {
      cipherText: ev.dek
    };

    exports.doPost(
      '/api/v2/keys/' + ev.kpRootKeyId + '?action=unwrap',
      JSON.stringify(formData),
      'unwrap key',
      (statusCode, result) => {
        logger.info('unwrapDEK: statusCode: ' + statusCode);
        if (statusCode != null) {
          logger.info('unwrapDEK: msg: ' + result.error);
          callback(statusCode, result.error);
        } else {
          logger.info('unwrapDEK result: ' + result);
          callback(statusCode, result);
        }
      }
    );

    return dek;
  };

  /* removes the wrapped_sym.key file sets ev.dek to null */
  exports.deleteDEK= function(callback) {
    fs.unlink(ev.wrappedFileName, (err) => {
      logger.info(err);
      if (err) {
        logger.error(err);
        callback('Error deleting DEK.');
      } else {
        ev.dek = null;
        callback(null);
      }
    });
  };

  exports._createRequest = function(token, httpMethod, path, formData) {
    let options = {
      url: 'https://' + ev.kpUrl + path,
      rejectUnauthorized: false,
      /*
      requestCert: true,
      agent: false,
      json: true,
      */
      method: httpMethod,
      headers: {
        'Accept':'application/vnd.ibm.collection+json',
        'Authorization': 'Bearer ' + token,
        'Bluemix-instance': ev.bluemixInstance,
        'Content-Type': 'application/vnd.ibm.kms.key_action+json'
      },
      form: formData
    };
    return options;
  };

  return exports;
};
