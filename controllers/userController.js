const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');

const filteredObj = (obj, ...filteredProp) => {
  let newObj = {}
  Object.keys(obj).forEach(el => {
    if (filteredProp.includes(el)) newObj[el] = obj[el]
  })
  return newObj
}

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});
exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route is not to update password.", 400))
  }
  //we will not use save method here becasue it will run all middleware and we are sending password here so will update
  //run validator will run only valdation for that particular field updated
  let filteredBody = filteredObj(req.body, 'name', 'email')
  const updatedUser = User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true })

  res.status(200).json({
    success: true,
    user: updatedUser
  })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false })

  res.status(204).json({
    success: true,
    user: null
  })
})
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
