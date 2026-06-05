const express = require('express');
const toursController = require('../controller/toursController');
const authController = require('./../controller/authController');
const reviewController = require('./../controller/reviewController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

/* Nested Route
example: //POST/tour/:tourId/reviews
         //GET/tour/tour:id/reviews 

 without express 

         router.route('/:tourId/reviews')
         .post(authController.protect,
             authController.restrictTo('user'),
             reviewController.createReviews)
*/

//with Express mearge two routes for nesting

router.use('/:tourId/reviews', reviewRouter);

// router.param('id',toursController.checkID)

router
  .route('/top-5-cheap')
  .get(toursController.aliasTopTours, toursController.getAllTours);

router.route('/tour-stats').get(toursController.gettourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    toursController.getMonthlyPlan,
  );

router
  .route('/')
  .get(toursController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.createTour,
  );
  router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(toursController.getToursWithin)

  router.route('/distances/:latlng/unit/:unit').get(toursController.getDistances);

router
  .route('/:id')
  .get(toursController.getSingleTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.uploadTourImages,
    toursController.resizeTourImages,
    toursController.getUpdateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.deleteTour,
  );

module.exports = router;
