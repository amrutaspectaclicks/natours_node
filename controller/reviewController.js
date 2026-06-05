const Review = require('./../model/reviewModel')
const factory = require('./factoryHandler')


exports.setTourUserId=(req,res,next)=>{
  if(!req.body.tours) req.body.tour = req.params.tourId    
  if(!req.body.users) req.body.user = req.user.id
  next();
}
exports.getAllReviews = factory.getAll(Review)
exports.getReview = factory.getOne(Review)
exports.createReview = factory.createOne(Review)
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
