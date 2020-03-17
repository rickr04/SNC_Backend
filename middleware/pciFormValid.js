const mongoose = require('mongoose');

const validator = require('../utils/validator');

async function pciFormValid(req, res, next) {
  try {
    var validPCIForm;
    //If there is no pciForm field
    if (!req.body.pciForm && !req.params.pciForm) {
      console.log('Invalid PCI Form!');
      return res.status(422).json({
        message: "Invalid PCI Form!"
      });
    //If the pciForm is in the params
    } else if (req.params.pciForm) {
      validPCIForm = req.params.pciForm;
    //Else
    } else {
      validPCIForm = req.body.pciForm;
    }

    //If no PCI Form exists
    if (!validator.pciForm(validPCIForm)) {
      console.log('Invalid PCI Form!');
      return res.status(422).json({
        message: "Invalid PCI Form!"
      });
    //Else
    } else {
      req.pciForm = validPCIForm;

      //Continue
      next();
    }
  } catch (err) {
    console.log('Invalid PCI Form!');
    return res.status(422).json({
      message: "Invalid PCI Form!"
    });
  }
};

module.exports = pciFormValid;
