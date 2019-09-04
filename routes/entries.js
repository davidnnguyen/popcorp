var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
const dekFunctions = require('../utils/dekFunctions.js')();
const ev = require('../env.js')().getEnv();
const aes256 = require('aes256');
const logger = require('../log.js')('entries');
//if no db specified, it goes to admin by default

/* GET contest entries page. */
router.get('/', function(req, res, next) {
  let entryId = null;
  if (req.query.id) {
    entryId = new ObjectId(req.query.id);
    logger.info(entryId);
  }
  MongoClient.connect(ev.mongoDBUrl, {useNewUrlParser: true}, function (err, db) {
    if (err) throw err;
    var dbo = db.db("admin");
    if (entryId != null) {
      dbo.collection("testCollection").findOne({'_id': entryId}, function (err, result) {
        if (err) throw err;
        db.close();

        let myObj = result;
        logger.info(result);

        // decrypt the PII
        dekFunctions.unwrapDEK((statusCode, result) => {
          if (statusCode != null) {
            logger.error(result);
            res.status(500).json({errorMsg: result});
          } else {
            let parsedObj = JSON.parse(result);

            logger.info('unwrapped base64 sym key: ' + parsedObj.plaintext);

            let symKey = parsedObj.plaintext;

            logger.info(myObj);
            let decDob = aes256.decrypt(symKey, myObj.dob);
            let decGender = aes256.decrypt(symKey, myObj.gender);
            let decPhone = aes256.decrypt(symKey, myObj.phone);
            let decEmail = aes256.decrypt(symKey, myObj.email);
            //let decName = aes256.decrypt(symKey, myObj.encName);

            let myDecryptedObj = {
              name: myObj.name,
              dob: decDob,
              gender: decGender,
              phone: decPhone,
              email: decEmail,
              decName: myObj.name
            };

            logger.info('decrypted obj: ' + JSON.stringify(myDecryptedObj));

            //return res.json(result);
            return res.json(myDecryptedObj);
          }
        });
      });
    } else {
      dbo.collection("testCollection").find().toArray(function (err, result) {
        if (err) throw err;
        db.close();
        console.log(result);
        return res.render('entries', {tableData: result});
      });
    }
  });
});


router.post('/', function(req, res, next) {
  MongoClient.connect(ev.mongoDBUrl, {useNewUrlParser: true}, function(err, db) {
    if (err) throw err;
    var dbo = db.db("admin");
    dbo.collection("testCollection").drop(function(err, delOK) {
      if (err) throw err;
      if (delOK) console.log("Collection deleted");
      dbo.createCollection("testCollection", function(err, res1) {
        if (err) throw err;
        console.log("Collection created!");
        db.close();
        res.render('entries');
      });
    });
  });
});


module.exports = router;



