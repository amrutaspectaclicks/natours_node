const multer = require('multer');
const sharp = require('sharp');

const Tour = require('./../model/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./factoryHandler')

const multerStorage = multer.memoryStorage();


const multerFilter = (req,file,cb)=>{
  if(file.mimetype.startsWith('image')){
    cb(null,true)
  }else{
    cb(new AppError('Not an image! Please upload only images.',400),false)
  }
}
 
//3)upload on data
const upload = multer({ 
  storage:multerStorage,
  fileFilter:multerFilter
 }); 

// exports.uploadTourImages = upload.fields([
//   {name:'imageCover',maxCount:1},
//   {name:'images', maxCount : 3}
// ]);

//debugging , middleware
exports.uploadTourImages = (req, res, next) => {
  upload.fields([
    { name:'imageCover', maxCount: 1 },
    { name:'images', maxCount: 3 }
  ])(req, res, err => {
    if (err) {
      console.log('FIELD:', err.field);
      console.log(err);
    }
    next(err);
  });
};

//uplod.single('image').  for 1 image
//upload.array('image',3)  for same field 

exports.resizeTourImages = catchAsync (async (req,res,next) => {

console.log(req.files);
  if(!req.files.imageCover || !req.files.images) return next();
  // [1] IMAGE COVER
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
  await sharp(req.files.imageCover[0].buffer)
  .resize(2000,1333)
  .toFormat('jpeg')
  .jpeg({quality:90})
  .toFile(`public/img/tours/${ req.body.imageCover}`);



  // [2] IMAGES
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );
   next()
})


exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};



exports.getAllTours = factory.getAll(Tour)
exports.getSingleTour = factory.getOne(Tour,{path:'reviews'})
exports.createTour = factory.createOne(Tour)
exports.getUpdateTour= factory.updateOne(Tour)
exports.deleteTour = factory.deleteOne(Tour)



exports.gettourStats = catchAsync(async (req, res,next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match :{__id:{$ne:'EASY'}}
    // }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

//Aggregation unwinding  and projecting
exports.getMonthlyPlan = catchAsync(async (req, res,next) => {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStart: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: { numTourStart: -1 },
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});



/* 
//middlerware to check id works only if have id(to inder stand use of middlewear ))
// exports.checkID = (req, res, next, val) => {
//   console.log(`id:${val}`)
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid Id',
//     });
//   }
//   next();
// };
//middleware to check body ontains name and price works only on post

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(
//       (400).json({
//         status: 'bad request',
//         message: 'missing name or price',
//       }),
//     );
//   }
// };

//send data server to client
/*
exports.getAllTours = async (req, res) => {
  try {
    //build query
    //1A Filterning
    console.log(req.query);
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    //1B Advanced Filterning
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    console.log(JSON.parse(queryStr));

    let query = Tour.find(JSON.parse(queryStr));

    //2 Sorting
    if (req.query.sort) {
      const sortBy = (req.query.sort).split(',').join(',')
      query = query.sort(sortBy);
    }else{
      query= query.sort('-createdAt')
    }
    // 3 Field Limited
    if(req.query.fields){
      const fields = req.query.fields.split(',').join(' ')
      query = query.select(fields);
    }else{
      query = query.select('-__v')
    }
   //Pagination
    const page = req.query.page * 1|| 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page-1)*limit
    query = query.skip(skip).limit(limit)

    if(req.query.page){
      const numTours = await Tour.countDocuments()
        if(skip >= numTours) throw new Error("This page does not exist")
    }
    const tours = await query;

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    res.status(404).json({
      //status 201 for created new on server
      status: 'fail',
      message: err.message,
    });
  }
}; */