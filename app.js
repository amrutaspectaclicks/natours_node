const express = require('express');
const path = require('path');
const pug = require('pug');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser')
const compression = require('compression')

const AppError = require('./utils/appError');
const errController = require('./controller/errorController');
const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

//set template engin
app.set('view engine','pug');
app.set('views',path.join(__dirname,'views'))


//[1]GLOBAL MIDDLEWARES. //serving static file

app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
// app.use(helmet());

// Development logging ,Middleware = a function that runs between request and response
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP please try again in an hour',
});
app.use('/api', limiter);

//body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

//parse data coming from a URL encoded form.
app.use(express.urlencoded({extended:true,limit:'10kb'}))

//cookie parser: parser data from cookies
app.use(cookieParser())

// Data sanitization against NOSQL query injection
app.use(mongoSanitize());

//data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

app.use(express.json());
app.use(compression())

//Test Middleware
app.use((req, res, next) => {
  req.reqestTime = new Date().toISOString();
   // console.log(req.method, req.originalUrl);
  // console.log(req.cookies)
  next();
});
//Mounting Routes

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

// handle undefined routes //

// this is handler to convert html error to json format
app.all('*', (req, res, next) => {
  next(new AppError(`cant find ${req.originalUrl} on this server`));
});

// error middleware

app.use(errController);

module.exports = app;
