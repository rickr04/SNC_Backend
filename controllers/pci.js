const KnowledgeBase = require('../models/knowledgeBase');

const mongoose = require('mongoose');

const getPCIModel = require('../utils/getPCIModel');
const formatPCI = require('../utils/formatPCI');
const throwErr = require('../utils/throwErr');

//Get User info
//GET localhost:3000/users/
/* Retrieve information about your User account. */
async function getForm(req, res, next) {
  try {
    const pciVersion = req.pciVersion;      //PCI Version
    const pciForm = req.pciForm;            //PCI Form

    const Questions = getPCIModel(req.pciVersion);
    const form = await Questions.find({ SAQ: req.pciForm }).sort({ requirement: 1 }).exec();

    let kID = [];
    for (q in form) {
      for (k in form[q].kIDs) {
        kID.push(form[q].kIDs[k]);
      }
    }
    let kIDs = await KnowledgeBase.find({ kID: {$in : kID} }).exec();
    var kIDList = new Object();
    for (k in kIDs) {
      kIDList[kIDs[k].kID] = kIDs[k].description;
    }

    var output = formatPCI(form, kIDList);
    //console.log({ Sections: output });
    return res.status(200).json({
      Sections: output
    });
  } catch (err) {
    throwErr(res, err);
  }
};

exports.getForm = getForm;

//Written by Nathan Schwartz (https://github.com/CGTNathan)
