/**
 * Express router.
 * @module
 * @requires {@link https://www.npmjs.com/package/express}
 * @requires {@link https://www.npmjs.com/package/cors}
 */
const express = require('express');
const router = express.Router();
const cors = require('cors');
const SuperUser = require('../models/SuperUser');
const AccountSAQ = require('../models/AccountSAQ');
const Question = require('../models/Question');
const SAQTemplate = require('../models/SAQTemplate');
const s3Handling = require('../services/file-upload');
const Mail = require('../services/email-send');
const fetch = require("node-fetch");
const AnsweredQuestion = require('../models/AnsweredQuestion')

var corsOptions = {
  credentials: true,
  origin: 'http://localhost:4200',
  httpOnly: false,
  secure: false,
};

router.options('*', cors())
router.use(cors());

/**
 * Registers a SuperUser
 *
 * @name SuperUser Registration
 * @path {POST} /api/register
 * @body {string} email
 * @body {string} fname
 * @body {string} lname
 * @body {string} password
 * @body {string} address
 * @body {string} company
 * @body {string} telephone
 * @body {JSON} businessinfo - JSON consisting of city, state, country, zipcode, and dba fields
 * @response {object} data - The newly created user object {@link module:models/SuperUser~SuperUser}
 */
router.post('/api/register', cors(corsOptions), (req, res, next) => {
  var superUserData = {
    email: req.body.email,
    fname: req.body.fname,
    lname: req.body.lname,
    password: req.body.password,
    address: req.body.address,
    company: req.body.company,
    telephone: req.body.telephone,
    issuper: true,
    businessinfo: req.body.info
  }
  var fullUrl = req.protocol + '://' + req.get('host') + '/api/email';
  //Needs to be async for fetch call
  SuperUser.create(superUserData, function(error, superuser) {
    if (error) {
      return next(error);
    } else {
      req.session.superuserId = superuser._id;
      //this is ugly nested for now
      var mailData = {
        type: "register",
        email: req.body.email,
        name: req.body.fname,
        company: req.body.company
      }
      Mail.sendMail(mailData, (err) => {
        if (err) {
          return next(err);
        }
      });
      return res.status(error ? 500 : 200).send(error ? error : {
        message: "Super User has been registered",
        data: superuser
      });
    }
  });
});

/**
 * Registers a SubUser
 *
 * @name SubUser Registration
 * @path {POST} /api/registersub/:_id
 * @body {string} email
 * @body {string} fname
 * @body {string} lname
 * @body {string} password
 * @body {string} address
 * @body {string} company
 * @body {string} telephone
 * @body {array} saqtemplates - Array of SAQ template ID's a user has access to
 * @params {string} _id - The ID of the SuperUser the Sub is under
 * @response {object} data - Newly created user object  {@link module:models/SuperUser~SuperUser}
 */
router.post('/api/registersub/:_id', cors(corsOptions), (req, res, next) => {
  SuperUser.findById(req.params._id).exec((err, superuser) => {
    if (err) {
      return res.json({
        success: false,
        message: err.message
      });
    } else {
      var superUserData = {
        email: req.body.email,
        fname: req.body.fname,
        lname: req.body.lname,
        password: req.body.password,
        address: superuser.address,
        company: superuser.company,
        telephone: req.body.telephone,
        saqtemplates: req.body.saqtemplates,
        issuper: false,
        superuser: req.params._id
      };
      var fullUrl = req.protocol + '://' + req.get('host') + '/api/email';
      //Needs to be async for fetch call
      SuperUser.create(superUserData, function(error, sup) {
        if (error) {
          return next(error);
        } else {
          if (!sup.issuper) SuperUser.findOneAndUpdate({
            _id: sup.superuser
          }, {
            $push: {
              subusers: sup._id
            }
          });
          req.session.superuserId = superuser._id;
          //this is ugly nested for now
          var mailData = {
            type: "register",
            email: req.body.email,
            name: req.body.fname,
            company: req.body.company
          }
          Mail.sendMail(mailData, (err) => {
            if (err) {
              return next(err);
            }
          });
          return res.status(error ? 500 : 200).send(error ? error : {
            message: "Sub User has been registered",
            data: superuser
          });
        }
      });
    }
  });
});

/**
 * Gets an array of SAQTemplate IDs a user has access to
 *
 * @name SAQ Assignments
 * @path {GET} /api/saqassignments/:_id
 * @params {string} _id - The ID of the user you want acess to
 * @response {array} data - If the user is a SubUser it will return an array of SAQTemplate IDs,  {@link module:models/SAQTemplate~SAQTemplate}. If the user is a Super, it will return true for a super
 */
router.get('/api/saqassignments/:_id', cors(corsOptions), (req, res, next) => {
  SuperUser.SAQAssignments(req.params._id, (err, saqs) => {
    if (err) {
      return res.json({
        success: false,
        message: err.message
      });
    } else {
      return res.json({
        success: true,
        data: saqs
      });
    }
  });
});

/**
 * Login
 *
 * @name Login
 * @path {POST} /api/login
 * @body {string} email
 * @body {string} password
 * @response {object}  data - Returns the User who just logged in {@link module:models/SuperUser~SuperUser}
 */
router.post('/api/login', cors(corsOptions), (req, res, next) => {
  var superuserdata = {
    email: req.body.email,
    password: req.body.password
  }
  SuperUser.authenticate(superuserdata.email, superuserdata.password, function(error, superuser) {
    if (error || !superuser) {
      var err = new Error('Wrong username or password.');
      err.status = 401;
      return next(error);
    } else {
      req.session.superuserId = superuser._id;
      return res.status(err ? 500 : 200).send(err ? err : {
        message: "Super User has been logged in",
        data: superuser
      });
    }
  });
});

/**
 * Get User
 *
 * @name Get User
 * @path {GET} /api/superuser/find/:_id
 * @params {string} _id - The user ID you want to get
 * @response {object}  data - Returns the User  {@link module:models/SuperUser~SuperUser}
 */
router.get('/api/superuser/find/:_id', cors(corsOptions), function(req, res, next) {
  SuperUser.findById(req.params._id).exec((err, superuser) => {
    if (err) {
      return res.json({
        success: false,
        message: err.message
      });
    } else {
      return res.json({
        success: true,
        data: superuser
      });
    }
  });
});

//check if authenticated
router.get('/api/superuser/auth', cors(corsOptions), function(req, res, next) {
  var auth = "false"
  var err = new Error('Not Authorized');
  if (req.session.superuserId) {
    err.status = 200;
    auth = "true";
  } else {
    err.status = 401;
    auth = "false";
  }
  return res.json({
    status: err.status,
    data: [auth]
  });
});

/**
 * Update user password
 *
 * @name Update Password
 * @path {POST} /api/superuser/update/password
 * @body {string} _id - The User ID
 * @body {string} new - The new password
 * @response {object}  data - Returns the User who we changed  {@link module:models/SuperUser~SuperUser}
 */
router.post('/api/superuser/update/password', cors(corsOptions), (req, res, next) => {
  if (req.session && req.body._id == req.session.superuserId) {
    SuperUser.findById(req.body._id, function(err, superuser) {
      if (err) {
        var err = new Error('SuperUser Not Found');
        err.status = 401;
        return next(err);
      } else {
        superuser.password = req.body.new;
        superuser.save(function(error) {
          if (err) {
          } else {
            return res.status(err ? 500 : 200).send(err ? err : {
              message: "Password Successfully Changed",
              data: superuser
            });
          }
        });
      }
    });
  } else {
    var err = new Error('Not Authorized');
    err.status = 400;
    return next(err);
  }
});

/* Post DB questions
This is outdated, best option would be to edit the script when new questions/templates are created.
JSON format as follows, I choose to manually assign IDs so that we can
better track our form fields and their corresponding IDs.
{
  "questiontext":"What is the date?",
  "answertype":"0",
  "id":"123abc"
} */
router.post('/api/admin/question', (req, res, next) => {
  let newQuestion = new Question({
    questiontext: req.body.questiontext,
    answertype: req.body.answertype,
    _id: req.body.id
  });
  newQuestion.save((err, question) => {
    if (err) {
      return res.json({
        success: false,
        message: err.message
      });
    } else {
      return res.json({
        success: true,
        message: 'Question posted',
        data: question
      });
    }
  });
});

/*
This is outdated, best option would be to edit the script when new questions/templates are created.
Posts SAQ Template. Name is the SAQ type, questions are question IDs
{
	"name":"a",
	"questions":["a2","a1"]
} */
router.post('/api/admin/SAQTemplate', (req, res, next) => {
  let newSAQTemplate = new SAQTemplate({
    name: req.body.name,
    questions: req.body.questions
  });
  newSAQTemplate.save((err, template) => {
    if (err) {
      return res.json({
        success: false,
        message: err.message
      });
    } else {
      return res.json({
        success: true,
        message: 'SAQ template posted',
        data: template
      });
    }
  });
});

/**
 * Get Questions from SAQTemplate
 *
 * @name Get SAQTemplate Questions
 * @path {GET} /api/SAQ:id
 * @params {string} id - The ID of the SAQTemplate
 * @response {object}  data - Returns an array of questions {@link module:models/Question~Question}
 */
router.get('/api/SAQ/:id', (req, res, next) => {
  SAQTemplate.findById(req.params.id).populate('questions').exec((err, question) => {
    if (err) {
      return res.json({
        success: false,
        message: err.message
      });
    } else {
      return res.json({
        success: true,
        data: question.questions
      });
    }
  });
});

/**
 * Complete SAQ. This route does a lot. It takes a User ID, SAQTemplate ID, and a JSON of answers.
 * It creates/updates the relevant AccountSAQ, fills the PDF, and uploads it to S3.
 *
 * @name Submit AccountSAQ
 * @path {POST} /api/SAQ/:_id/completesaq/:templateid
 * @body {JSON} answers - JSON with Question IDs as field names and user answers as the corresponding field value
 * @params {string} _id - The User ID
 * @params {string} templateid - The SAQTemplateID
 * @response {boolean} success - True if succesful
 */
router.post('/api/SAQ/:_id/completesaq/:templateid', (req, res, next) => {
  AccountSAQ.createAndUpdateSAQ(req.params.templateid, req.params._id, req.body.answers, (err, acctSAQ) => {
    if (err) {
      return res.json({
        success: false,
        message: err.message
      });
    } else {
      AccountSAQ.getAccountSAQJSON(acctSAQ, (err, acctJSON) => {
        if (err) {
          return res.json({
            success: false,
            message: err.message
          });
        } else {
          if (req.body.action == "save") {
            return res.json({
              success: true,
              message: "Success"
            });
          } else {
            req.body.answers = acctJSON;
            s3Handling.editForm({
              Bucket: process.env.S3_BUCKET,
              Key: req.params.templateid + '.pdf'
            }, req.body, (err, data) => {
              if (err) {
                return res.json({
                  success: false,
                  message: err.message
                });
              } else {
                s3Handling.upload(req.params._id, data, req.params.templateid, (err) => {
                  if (err) {
                    return res.json({
                      success: false,
                      message: err.message
                    });
                  } else {
                    return res.json({
                      success: true,
                      message: "Success"
                    });
                  }
                });
              }
            });
          }
        }
      });
    }
  });
});

/**
 * Pass JSON with Folder key to the Folder you want (typically a User ID).
 * Returns an array of the keys of all files in that folder
 *
 * @name Get S3 Keys
 * @path {GET} /api/SAQ/:_id/getkeys/:templateid
 * @params {string} _id - The ID of the user whos corresponding keys you want
 * @params {string} templateid - The ID of the SAQ template who you want files for
 * @response {array} data - Array of S3 keys
 */
router.get('/api/SAQ/:_id/getkeys/:templateid', (req, res, next) => {
  s3Handling.getFolderKeys(req.params._id, req.params.templateid, (err, keyArray) => {
    if (err) {
      return res.json({
        success: false,
        message: err.message
      });
    } else {
      return res.json({
        success: true,
        data: keyArray
      });
    }
  });
});

/**
 * Allows you to download from S3
 *
 * @name Download form from S3
 * @path {POST} /api/SAQ/getform
 * @body {string} key - They key from the file you want
 * @response {data} data - The file you want
 */
 router.post('/api/SAQ/getform', (req, res, next) => {
  s3Handling.downloadFile(req.body.key, (err, data) => {
    if (err) {
      res.json({
        success: false,
        msg: err.message
      });
    } else {
      //res.download(data.Body);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=some_file.pdf',
        'Content-Length': data.Body.length
      });
      res.end(data.Body);
    }
  });
});

/**
 * Lists all the keys in the entire S3 bucket for testing purposes
 *
 * @name Get all Keys
 * @path {GET} /api/admin/S3/keys
 * @response {array} data - All the keys in our bucket
 */
router.get('/api/admin/S3/keys', (req, res, next) => {
  s3Handling.getFolderKeys(null, (err, keys) => {
    if (err) {
      return res.json({
        success: false,
        message: err.message
      });
    } else {
      return res.json({
        success: true,
        message: "Success",
        data: keys
      });
    }
  });
});

/**
 * Gets the AnsweredQuestion objects associated with a user and template
 *
 * @name Get AccountSAQ
 * @path {GET} /api/SAQ/:_id/getsaq/:templateid
 * @params {string} _id - The User ID
 * @params {string} templateid - The SAQTemplate ID
 * @response {array} data - Array of AnsweredQuestion objects {@link module:models/AnsweredQuestion~AnsweredQuestion}
 */
router.get('/api/SAQ/:_id/getsaq/:templateid', (req, res, next) => {
  AccountSAQ.getAccountSAQ(req.params.templateid, req.params._id, (err, newSAQ) => {
    if (err) {
      return res.json({
        success: false,
        message: err.message
      });
    } else {
      AccountSAQ.findById(newSAQ._id).populate({
        path: 'answeredquestions',
        options: {
          sort: {
            question: 1
          }
        },
        populate: {
          path: 'question'
        }
      }).exec((err, populatedSAQ) => {
        if (err) {
          return res.json({
            success: false,
            message: err.message
          });
        } else {
          return res.json({
            success: true,
            data: populatedSAQ.answeredquestions
          });
        }
      });
    }
  });
});

/**
 * Gets all of the Yes with CCW answers associated with a User
 *
 * @name Get CCW
 * @path {GET} /api/SAQ/:_id/getccw
 * @params {string} _id - The User ID
 * @response {array} data - Array of populated AnsweredQuestion objects {@link module:models/AnsweredQuestion~AnsweredQuestion}
 */
router.get('/api/SAQ/:_id/getccw', (req, res, next) => {
  AnsweredQuestion.getCCW(req.params._id, (err, answers) => {
    if (err) {
      return res.json({
        success: false,
        message: err.message
      });
    } else {
      return res.json({
        success: true,
        data: answers
      });
    }
  });
});

/**
 * Updates CCW information for one question
 *
 * @name Submit CCW
 * @path {POST} /api/SAQ/:_id/submitccw
 * @body {string} _id - The regular Question ID
 * @body {JSON} data - JSON of the CCW responses for the question
 * @params {string} _id - The User ID
 * @response {object} data - The newly updated AnsweredQuestion object {@link module:models/AnsweredQuestion~AnsweredQuestion}
 */
router.post('/api/SAQ/:_id/submitccw', (req, res, next) => {
  req.body.data.shift();
  AnsweredQuestion.answerCCW(req.params._id, req.body._id, req.body.data, (err, quest) => {
    if (err) {
      return res.json({
        success: false,
        message: err.message
      });
    } else {
      return res.json({
        success: true,
        data: quest
      });
    }
  });
});

/**
 * Downloads CCW answers in Excel format
 *
 * @name Download CCW
 * @path {GET} /api/SAQ/:_id/downloadccw
 * @params {string} _id - The User ID
 * @response {data} xls - Excel sheet with CCW info
 */
router.get('/api/SAQ/:_id/downloadccw', (req, res, next) => {
  AnsweredQuestion.downloadCCW(req.params._id, (err, answers) => {
    if (err) {
      return res.json({
        success: false,
        message: err.message
      });
    } else {
      return res.xls('ccw.xlsx', answers);
    }
  });
});

module.exports = router;
