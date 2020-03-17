const express = require('express');

const uController = require('../controllers/users');

//const userAuth = require('../middleware/userAuth');

//localhost:3000/users
const router = express.Router();

//Users

//Get info
router.get('/', /*userAuth,*/ uController.getUser);

/*
//SignUp
router.post('/signup', uController.signUp);

//Verify
router.post('/verify', uController.verify);

//SignUp
router.post('/signup', uController.signUp);

//LogIn
router.post('/login', uController.logIn);

//Update
router.put('/name', userAuth, userExist, uController.updateName);
router.put('/image', userAuth, userExist, imageValid.single('image'), uController.updateImage);
router.put('/password', userAuth, userExist, uController.updatePassword);

//DeleteUser
router.delete('/', userAuth, userExist, uController.deleteUser);
*/

module.exports = router;
