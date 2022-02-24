const Review = require('../models/reviewModel')
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getAllReviews = catchAsync(async (req, res, next) => {
    const reviews = await Review.find();

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews
        }
    });
});

exports.createReview = catchAsync(async (req, res, next) => {

    //Allow nesting route
    //user can send user and tour id in req.body OR
    //send tour id in params with current logged in user 
    if (!req.body.tour) req.body.tour = req.params.tourId
    if (!req.body.user) req.body.user = req.user.id
    const newReview = await Review.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            review: newReview
        }
    });

});