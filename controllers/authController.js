const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const crypto = require('crypto')

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.EXPIRES_IN
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    success: true,
    token,
    data: {
      user: newUser
    }
  });
});

exports.signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    next(new AppError('Please Provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    next(new AppError('Either Email or password is incorrect', 401));
  }

  const token = signToken(user._id);

  res.status(200).json({
    success: 'true',
    token
  });
});

exports.protectRoute = catchAsync(async (req, res, next) => {
  // checking if token exist
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in ! Kindly login to get access', 401)
    );
  }

  //verifing token
  //we are using promisif so jwt.sign will return promise otherwise have to use callback fucntion
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //Check if user exist
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('The user belonging to token does not exist', 401)
    );
  }

  //Check if user changed password

  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Password was changed kindly login again!', 401));
  }

  //Grant Access
  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have permission to perform this action", 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //Check if user exist with email
  const user = await User.findOne({ email: req.body.email });

  //Making a token to be send in email
  const resetToken = user.generateTokenResetPassword();
  await user.save({ validateBeforeSave: false });

  //making a lin to send
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot yout password?" Submit a PATCH request with your new password and passwordConfirm to:${resetUrl}.\nIf you did'nt forgot your password, please ignore this email`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message: message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordExpireToken = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sedning the email.Try again later', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //Check if user exist with this token
  let hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  //Getting User
  let user = User.findOne({ passwordResetToken: hashedToken, passwordExpireToken: { $gt: Date.now() } })

  if (!user) {
    return next(new AppError('Token is invalid or has been expired.', 400))
  }
  //Updating password
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  user.passwordResetToken = undefined
  user.passwordExpireToken = undefined
  await user.save()

  const token = signToken(user._id);

  res.status(200).json({
    success: 'true',
    token
  });

});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //if user exist
  let user = await User.findById(req.user.id).select("+password")


  let match = await user.correctPassword(req.body.currentPassword, user.password)

  if (!match) {
    return next(new AppError('Password does not match', 401))
  }

  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm

  await user.save()

  const token = signToken(user._id);

  res.status(200).json({
    success: 'true',
    token
  });
})