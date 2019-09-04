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
const querystring = require('querystring');
const request = require('request');
const ev = require('../env.js')().getEnv();

const logger = require('../log.js')('utils.iam-token-utils');
console.log(ev);

/**
 * This class will manage the deployment
 **/
module.exports = function () {
  let exports = {};

  exports.getToken = function(cmUrl, callback) {
    let validToken = false;
    let currentTime = Date.now();

    if (cmUrl in ev.kpTokens) {
      if (currentTime < (ev.kpTokens[cmUrl].ts + 1800000)) { //keep token for 30 minutes
        validToken = true;
        callback(null, ev.kpTokens[cmUrl].token);
      }
    }

    if (!validToken) {
      exports.createToken(cmUrl, (err, token) => {
        if (err) {
          logger.info('iam-token-utils', 'getToken', 'Error creating token for ' + cmUrl + ' - ' + err);
          callback(err);
        } else {
          callback(null, token);
        }
      });
    }
  };

  exports.createToken = function(cmUrl, callback) {
    if (!ev.cmIamApiKey) {
      callback('Error - apikey is null or empty');
      return;
    }

    let content = querystring.stringify({
      'grant_type'   : 'urn:ibm:params:oauth:grant-type:apikey',
      'apikey'       : ev.cmIamApiKey
    });

    let options = {
      url: ev.cmIamUrl + '/oidc/token',
      method: 'POST',
      body: content
    };

    request(options, function (error, response, body) {
      let displayApiKey = ev.cmIamApiKey.substring(0, 8).concat('...');
      if (error) {
        logger.info('Error getting token for apiKey', displayApiKey, error);
        callback(error);
      } else {
        let token = JSON.parse(body).access_token;

        if (!token) {
          logger.info('iam-token-utils',
            'createToken',
            'No access token returned for',
            displayApiKey);
          callback('No access token returned');
        } else {
          logger.info('iam-token-utils', 'createToken',
            'Token created for ' + displayApiKey + ' >> ' +
            token.toString().substring(0, 8).concat('...'));
          ev.kpTokens[cmUrl] = {token: token, ts: Date.now()};
          callback(null, token);
        }
      }
    });
  };

  return exports;
};
