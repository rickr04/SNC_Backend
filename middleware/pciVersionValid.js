const mongoose = require('mongoose');

const validator = require('../utils/validator');

async function pciVersionValid(req, res, next) {
  try {
    var validPCIVersion;
    //If there is no pciVersion field
    if (!req.body.pciVersion && !req.params.pciVersion) {
      console.log('Invalid PCI Version!');
      return res.status(422).json({
        message: "Invalid PCI Version!"
      });
    //If the pciVersion is in the params
    } else if (req.params.pciVersion) {
      validPCIVersion = req.params.pciVersion;
    //Else
    } else {
      validPCIVersion = req.body.pciVersion;
    }

    //If no PCI Version exists
    if (!validator.pciVersion(validPCIVersion)) {
      console.log('Invalid PCI Version!');
      return res.status(422).json({
        message: "Invalid PCI Version!"
      });
    //Else
    } else {
      req.pciVersion = validPCIVersion;

      //Continue
      next();
    }
  } catch (err) {
    console.log('Invalid PCI Version!');
    return res.status(422).json({
      message: "Invalid PCI Version!"
    });
  }
};

module.exports = pciVersionValid;
