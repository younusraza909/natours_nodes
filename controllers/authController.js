const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const jwt = require('jsonwebtoken')
const AppError = require('../utils/appError')


const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN
    })

}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    })

    const token = signToken(newUser._id)

    res.status(201).json({
        success: true,
        token,
        data: {
            user: newUser
        }
    })
})


exports.signin = catchAsync(async (req, res, next) => {
    const { email, password } = req.body

    if (!email || !password) {
        next(new AppError("Please Provide email and password", 400))
    }

    const user = await User.findOne({ email }).select('+password')

    if (!user || !(await user.correctPassword(password, user.password))) {
        next(new AppError("Either Email or password is incorrect", 401))
    }


    const token = signToken(user._id)

    res.status(200).json({
        success: 'true',
        token
    })
})