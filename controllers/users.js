const User = require('../models/users');

const mongoose = require('mongoose');
const request = require('request-promise');

const throwErr = require('../utils/throwErr');

//Get User info
//GET localhost:3000/users/
/* Retrieve information about your User account. */
async function getUser(req, res, next) {
  try {
    const user = req.user;      //User

    console.log('\n'+user+'\n');
    return res.status(200).json({
      email: user.email,
      fname: user.fname,
      lname: user.lname,
      address: user.address,
      company: user.company,
      telephone: user.telephone,
      dob: user.dob,
      image: user.image,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      userId: user._id
    });
  } catch (err) {
    throwErr(res, err);
  }
};

exports.getUser = getUser;

//Written by Nathan Schwartz (https://github.com/CGTNathan)
