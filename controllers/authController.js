const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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

  console.log(resetToken);

  next();
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //
});
