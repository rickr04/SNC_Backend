const User = require('../models/users');

const mongoose = require('mongoose');

function validateEmail(email) {
  if (email) {
    var re = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    return re.test(String(email).toLowerCase());
  } else {
    return false;
  }
};

function validatePhone(phone) {
  if (phone) {
    var re = /^(1{1})(\d{3})(\d{3})(\d{4})$/;
    return re.test(phone);
  } else {
    return false;
  }
};

function validateString(string) {
  if (string) {
    return (typeof string === 'string' || string instanceof String);
  } else {
    return false;
  }
};

function validateNumber(number) {
  if (typeof number === 'number') {
    return true;
  } else {
    return false;
  }
};

function validateDOB(dob) {
  if (typeof dob === 'string' || string instanceof String) {
    var re = /^(\d{4})\-(\d{2})\-(\d{2})$/;
    return re.test(dob);
  } else {
    return false;
  }
}

function validatePCIVersion(pciVersion) {
  if (validateString(pciVersion)) {
    switch(pciVersion) {
      case "3.2.1": case "4.0":
        return true;
      default:
        console.log(pciVersion);
        return false;
    }
  } else {
    return false;
  }
}

function validatePCIForm(pciForm) {
  if (validateString(pciForm)) {
    switch(pciForm) {
      case "A": case "A-EP": case "B":
      case "B-IP": case "CVT": case "C":
      case "PPE": case "DMERCHANT": case "DSERVICE":
        return true;
      default:
        return false;
    }
  } else {
    return false;
  }
}

exports.email = validateEmail;
exports.phone = validatePhone;
exports.string = validateString;
exports.number = validateNumber;
exports.dob = validateDOB;
exports.pciVersion = validatePCIVersion;
exports.pciForm = validatePCIForm;

//Written by Nathan Schwartz (https://github.com/CGTNathan)
