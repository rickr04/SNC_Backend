function formatPCI (form, kIDList) {
  var formattedPCI = [];
  var usingScope = false;
  var scope = "0.0";

  var formattedQuestion = new Object();
  formattedQuestion.questions = [];
  formattedQuestion.header = false;

  for (q in form) {
    if (!usingScope) {
      if (q != 0) {
        formattedPCI.push(formattedQuestion);
        formattedQuestion = new Object()
        formattedQuestion.questions = [];
        formattedQuestion.header = false;
      }
    } else if (!isInScope(form[q].requirement, scope)) {
      usingScope = false;
      formattedPCI.push(formattedQuestion);
      formattedQuestion = new Object();
      formattedQuestion.questions = [];
      formattedQuestion.header = false;
    }
    var links = [];
    for (k in form[q].keywords) {
      links.push({
        keyword: form[q].keywords[k],
        description: kIDList[form[q].kIDs[k]]
      });
    }

    if (form[q].header == true) {
      scope = getBasic(form[q].requirement);
      usingScope = true;
      formattedQuestion.header = true;
      formattedQuestion.headQ = {
        question: form[q].question,
        requirement: form[q].requirement
      }
    } else {
      formattedQuestion.questions.push({
        question: form[q].question,
        requirement: form[q].requirement,
        expectedTesting: form[q].expectedTesting,
        responses: form[q].responses,
        recommendedEvidence: form[q].recommendedEvidence,
        links: links
      });
    }

  }
  formattedPCI.push(formattedQuestion);

  return formattedPCI;
}

function getBasic(req) {
  var scope = req.split(".");
  if (!(typeof parseInt(scope[scope.length-1]) === 'number')) {
    scope.pop();
  }
  return scope;
}

function isInScope(req, scope) {
  if (parseInt(scope[scope.length-1]) >= getBasic(req)[scope.length-1]) {
    return true
  } else {
    return false
  }
}

exports.formatPCI = formatPCI;

module.exports = formatPCI;
