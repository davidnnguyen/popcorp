const shelljs = require('shelljs');
var express = require('express');
var router = express.Router();
const fs = require('fs');
const dekFunctions = require('../utils/dekFunctions.js')();
const ev = require('../env.js')().getEnv();
const logger = require('../log.js')('dekAdmin');

/* GET DEK management page. */
router.get('/', function(req, res, next) {
  let dekExists = false;
  console.log(ev.dek);
  if (ev.dek !== null) {
    console.log('inside if');
    dekExists = true;
    res.render('dekAdmin', {dekExists: dekExists,
        errorMsg: 'A DEK already exists for the PopSoda Corp Demonstration'
    });
  }
  else {
    console.log('dekExists: ' + dekExists);
    res.render('dekAdmin', {dekExists: dekExists});
  }
});

router.post('/', function(req, res, next) {
  if(req.body.action === 'delete') {
    logger.info('delete called!');
    dekFunctions.deleteDEK((err) => {
      logger.info('deleteDEK: ' + err);
      if (err) {
        res.render('dekAdmin', {dekExists: true, errorMsg: err});
      } else {
        ev.dek = null;
        res.render('dekAdmin', {dekExits: false, successMsg: 'Successfully removed DEK.'});
      }
    });
  }
  else {
  let error = '';
  let respBody = '';

  logger.info('ev.dek: ' + ev.dek);
  if (!fs.exists(ev.wrappedFileName) || ev.dek == null) {
    // Generate a Data Encryption Key (DEK)
    shelljs.exec('openssl rand 256 -base64 > sym_keyfile.key', (code, stdout, stderr) => {
        console.log(code);

        if (code > 0) {
          console.log(stderr);
          error = stderr;
          return;
        }

        // Call the Key Protect wrap function on the DEK to secure the key
        // Tuck this key away to be used
        let filename = 'sym_keyfile.key';
        fs.open(filename, 'r', (err, fh) => {
          fs.readFile(fh, 'utf-8', (err, contents) => {
            // Make a POST request to wrap the DEK
            console.log('getToken: calling kpUrl: ' + ev.kpUrl);
            let buff = new Buffer(contents);
            logger.info('utf-8:' + buff);

            let formData = {
              plainText: contents
            };
            logger.info('base64: ' + formData);

            dekFunctions.doPost('/api/v2/keys/' + ev.kpRootKeyId +
              '?action=wrap', JSON.stringify(formData), 'wrapped key',
            (statusCode, msg) => {
              if (statusCode != null) {
                error = msg.error;
                return;
              }

              respBody = msg;
              let respObj = JSON.parse(msg);
              ev.dek = respObj.ciphertext;
              fs.open(ev.wrappedFileName, 'w+', (err, fh) => {
                fs.writeFile(fh, respObj.ciphertext, (err) => {
                  if (err) {
                    logger.error(err);
                  }
                })
              });
              logger.info('statusCode: ' + statusCode);
              logger.info(msg);

              fs.unlink(filename, (err) => {
                if (err) logger.error(err);
              });

              if (error) {
                logger.info('rendering with error: ' + error);
                res.render('dekAdmin', {errorMsg: error});
              } else {
                logger.info('rendering success or init: ' + respBody);
                res.render('dekAdmin', {
                  dek: ev.dek,
                  successMsg: 'Successfully generated a DEK.'
                });
              }
            });
          });
        });
      });
    } else {
      res.render('dekAdmin', {
        dekExists: true,
        errorMsg: 'A DEK has already been generated!'
      });
    }
  }
});

module.exports = router;
