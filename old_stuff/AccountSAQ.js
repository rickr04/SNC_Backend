/**
 * @module
 */
const mongoose = require('mongoose');
const SAQTemplate = require('./SAQTemplate');
const AnsweredQuestion = require('./AnsweredQuestion');
const Users = require('./SuperUser');

/**
 * Mongoose model for account SAQs.
 * @class AccountSAQ
 * @param {ObjectID} superuserid - Object ID referencing {@link models/SuperUser~SuperUser}.
 * @param {string} name - AccountSAQ name
 * @param {string} templateid - String ID referencing {@link models/SAQTemplate~SAQTemplate}.
 * @param {array} answeredquestions - Array of ObjectIDs referencing {@link models/AnsweredQuestion~AnsweredQuestion}
 */
var AccountSAQSchema = new mongoose.Schema({
  superuserid: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'SuperUser'
  },
  name: {
    type: String,
    unique: true,
    required: true,
  },
  templateid: {
    type: String,
    required: true,
    ref: 'SAQTemplate'
  },
  answeredquestions: [{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'AnsweredQuestion',
  }]
}, {
  timestamps: true
});

var AccountSAQ = mongoose.model('AccountSAQ', AccountSAQSchema);
module.exports = AccountSAQ;

/**
 * Callback passing the JSONforFill and the array of CCW obejcts
 * @callback module:models/AccountSAQ~getAccountSAQJSONCallback
 * @param {error} err
 * @param {JSON} JSONforFill - JSON needed for PDF filling
 * @param {array} ccw - Array of CCW JSONs
 */

/**
 * Gets JSON of account SAQ answers and CCW to build PDFs and excel sheets.
 * @function getAccountSAQJSON
 * @param {string} AccountSAQId - The ID of the Account SAQ
 * @param {module:models/AccountSAQ~getAccountSAQJSONCallback} callback
 */
module.exports.getAccountSAQJSON = (AccountSAQId, callback) => {
  // First we get the account SAQ and populate its fields
  AccountSAQ.findById(AccountSAQId).populate({
    path: 'answeredquestions',
    populate: {
      path: 'question'
    }
  }).populate('superuserid').exec((err, populatedSAQ) => {
    if (err) {
      callback(err)
    } else {
      // Check to make sure answers are valid for PDF filling
      var setCheck = new Set();
      setCheck.add("Yes").add("No").add("N/A").add("Yes with CCW");
      let superuser = populatedSAQ.superuserid;
      let JSONforFill = [];
      // If businessinfo exists, the we add it to the JSON for filling
      if (typeof superuser.businessinfo === 'object') JSONforFill = superuser.businessinfo;
      let ccw = [];
      // Add company info to JSON
      JSONforFill["Company Name"] = superuser.company;
      JSONforFill["Contact Name"] = superuser.fname + ' ' + superuser.lname;
      JSONforFill["Telephone"] = superuser.telephone;
      JSONforFill["Email"] = superuser.email;
      JSONforFill["Business Address"] = superuser.address;

      // Iterate through all the answers to format the JSON correctly
      populatedSAQ.answeredquestions.forEach((item, index, array) => {
        if (err) {
          callback(err);
        } else {
          // If answer type is multiple choice [id+answer] = "X"
          if (item.question.answertype == 1 && item.answer != '' && setCheck.has(item.answer)) {
            JSONforFill[item.question._id + item.answer] = "X";
            if (item.answer == "Yes with CCW") ccw.push(item.ccw);
            // If it's fill in the blank [_id]=answer
          } else if (item.question.answertype == 2) {
            JSONforFill[item.question._id] = item.answer;
          }
          if (index + 1 == array.length) callback(err, JSONforFill, ccw);
        }
      });
    }
  });
}

/**
 * Callback passing the new AccountSAQ
 * @callback module:models/AccountSAQ~buildAccountSAQCallback
 * @param {error} err
 * @param {AccountSAQ} newAccountSAQ - Newly created AccountSAQ object
 */

/**
 * Helper function that builds a new AccountSAQ and its relevant AnsweredQuestions.
 * @param {string} templateID - The SAQ template ID
 * @param {string} userID - The SuperUser ID
 * @param {string} name - What you want to name the new AccountSAQ
 * @param {module:models/AccountSAQ~buildAccountSAQCallback} callback
 */
let buildAccountSAQ = (templateID, userID, name, callback) => {
  let questionIDs = [];
  // Get and populate the relevant SAQTemplate
  SAQTemplate.findById(templateID).populate('questions').exec((err, question) => {
    if (err) {
      callback(err);
    } else {
      // Iterate through each question
      question.questions.forEach((item, index, array) => {
        // First check if AnsweredQuestion for that question exists for that userID
        AnsweredQuestion.findOne({
          question: item._id,
          superuserid: userID
        }).exec((err, tempAns) => {
          if (err) {
            callback(err);
          } else {
            // If AnswereQuestion exists, push it to the array
            if (tempAns != null) {
              questionIDs.push(tempAns._id);
              // If loop is done then create and save the AccountSAQ
              if (questionIDs.length == array.length) {
                // Need to put this in a function most likely
                let newAccountSAQ = new AccountSAQ({
                  superuserid: userID,
                  name: name,
                  templateid: templateID,
                  answeredquestions: questionIDs
                });
                newAccountSAQ.save((err, newAccountSAQ) => {
                  if (err) {
                    callback(err)
                  } else {
                    callback(err, newAccountSAQ);
                  }
                });
              }
              // If AnsweredQuestion does not exist, then create one for that userID, save it, and push it's ID to the array
            } else {
              let newAnswered = new AnsweredQuestion({
                question: item._id,
                superuserid: userID
              });
              newAnswered.save((err, savedAnswer) => {
                if (err) {
                  callback(err);
                } else {
                  questionIDs.push(savedAnswer._id);
                  // If loop is done then create and save AccountSAQ
                  if (questionIDs.length == array.length) {
                    let newAccountSAQ = new AccountSAQ({
                      superuserid: userID,
                      name: name,
                      templateid: templateID,
                      answeredquestions: questionIDs
                    });
                    newAccountSAQ.save((err, newAccountSAQ) => {
                      if (err) {
                        callback(err)
                      } else {
                        callback(err, newAccountSAQ);
                      }
                    });
                  }
                }
              });
            }
          }
        });
      });
    }
  });
}

/**
 * Callback passing the new AccountSAQ
 * @callback module:models/AccountSAQ~getAccountSAQCallback
 * @param {error} err
 * @param {AccountSAQ} saq - The SAQ associated with the account
 */

/**
 * Gets the account SAQ associated with a user and template
 * @param {string} tempID - The SAQ template ID
 * @param {string} userID - The ID of the user
 * @param {module:models/AccountSAQ~getAccountSAQCallback} callback
 */
module.exports.getAccountSAQ = (tempID, userID, callback) => {
  // First we get user to check if they are a SuperUser
  Users.findById(userID).exec((err, user) => {
    if (err) {
      callback(err);
    } else {
      // If they aren't a Super, we set the userID to that of the associated SuperUser
      if (!user.issuper) userID = user.superuser;
      // We find the AccountSAQ associated with the SuperUser ID and template ID
      AccountSAQ.findOne({
        superuserid: userID,
        templateid: tempID
      }).exec((err, saq) => {
        if (err) {
          callback(err);
        } else {
          // If the AccountSAQ already exists, we pass if to the callback
          if (saq) {
            callback(err, saq);
            // If not we build a new one and pass the new one to the callback
          } else {
            buildAccountSAQ(tempID, userID, tempID + userID, (err, saq) => {
              if (err) {
                callback(err);
              } else {
                callback(err, saq);
              }
            });
          }
        }
      });
    }
  });
}

/**
 * @callback module:models/AccountSAQ~updateSAQAnswersCallback
 * @param {error} err
 * @param {string} acctSAQ.id - The ID of the account SAQ we are updating
 */

/**
 * Helper function that updates account SAQ with new answers
 * @param {AccountSAQ} acctSAQ - The AccountSAQ to be updated
 * @param {JSON} answers  - JSON with answer fields set to the new answers
 * @param {module:models/AccountSAQ~updateSAQAnswersCallback} callback
 */
let updateSAQAnswers = (acctSAQ, answers, callback) => {
  // Loop through each question
  acctSAQ.answeredquestions.forEach((item, index, array) => {
    // If that question field does not exist in answers, we do nothing
    if (typeof answers[item.question] === 'undefined') {
      if (index + 1 == array.length) callback(err, acctSAQ._id);
      // If it does exist in answers, then we update the AnsweredQuestion and save.
    } else {
      item.answer = answers[item.question];
      item.save((err) => {
        if (err) {
          callback(err);
        } else if (index + 1 == array.length) {
          callback(err, acctSAQ._id);
        }
      });
    }
  });
}

/**
 * Creates/Updates an SAQ with new answers
 * @param {string} tempID - The ID of the SAQ template
 * @param {string} userID - The user ID
 * @param {JSON} answers - JSON with answer fields set to the new answers
 */
module.exports.createAndUpdateSAQ = (tempID, userID, answers, callback) => {
  // First we need to get the user to check if they are a SuperUser
  Users.findById(userID).exec((err, user) => {
    if (err) {
      callback(err);
    } else {
      // If they aren't a Super, we set the userID to that of the associated SuperUser
      if (!user.issuper) userID = user.superuser;
      // Try to get a populated AccountSAQ
      AccountSAQ.findOne({
        superuserid: userID,
        templateid: tempID
      }).populate('answeredquestions').exec((err, ansq) => {
        if (err) {
          callback(err);
        } else {
          // If the AccountSAQ exists already, we call updateSAQAnswers
          if (ansq) {
            updateSAQAnswers(ansq, answers, callback);
            // If it doesn't, we create an SAQ and then update it's answers.
          } else {
            buildAccountSAQ(tempID, userID, tempID + userID, (err, ansq) => {
              if (err) {
                callback(err);
              } else {
                updateSAQAnswers(ansq, answers, callback);
              }
            });
          }
        }
      });
    }
  });
}
