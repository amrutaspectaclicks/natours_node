const express = require('express');
const multer = require('multer')
const userController = require('./../controller/usersControllers');
const authController = require('./../controller/authController');



//Mounting route
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgetPassword', authController.forgetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//MIDDLEARE TO PROTECT ROUTE
router.use(authController.protect);

router.patch('/updatePassword', authController.updatePassword); // user self chnge pwd

router.get(
  '/me',

  userController.getMe,
  userController.getUser,
);
router.patch('/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe);
  
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'))

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
