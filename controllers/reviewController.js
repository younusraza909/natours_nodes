const Review = require('../models/reviewModel')
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory')

exports.getAllReviews = factory.getAll(Review)

exports.setTourUserIds = (req, res, next) => {
    //Allow nesting route
    //user can send user and tour id in req.body OR
    //send tour id in params with current logged in user 
    if (!req.body.tour) req.body.tour = req.params.tourId
    if (!req.body.user) req.body.user = req.user.id
}

exports.createReview = factory.createOne(Review)
exports.deleteReview = factory.deleteOne(Review)
exports.updateReview = factory.deleteOne(Review)
exports.getReview = factory.getOne(Review)