const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.route('/signup').post(authController.signup);
router.route('/signin').post(authController.signin);

router.route('/forgotpassword').post(authController.forgotPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);


router.route('/updatePassword').patch(authController.protectRoute, authController.updatePassword);
router.route('/delete').patch(authController.protectRoute, authController.delete);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router.route('/updateMe').patch(authController.protectRoute, userController.updateMe)

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
