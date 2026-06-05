const AppError = require('./../utils/appError');
//handling database error
const handleCastErrorDB = (err) => {
  const message = `Invalid${err.path}:${err.value}`;
  return new AppError(message, 400);
};
//handling database error
const handleDuplicateFieldDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
 
  const message = `Duplicate Field Value:${vallue} please use another value!`;
  return new AppError(message, 400);
};
//handling database error
const handleValidationErrorDB = (err) => {
  const error = Object.values(err.values).map((el) => el.message);
  const message = `Invalid input data ${error.join('. ')}`;
  return new AppError(message, 400);
};

// handaling error of JWT

const handleJWTError = () => {
  return new AppError('Invalid Token . Please log in Again!', 401);
};
// handaling error of JWT
const handleJWTExpiredError = () => {
  return new AppError('Your token has Expired. Please log in Again!', 401);
};
// handaling error of development
const sendErrorDev = (err, req, res, next) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
    });
  }
  //RENDER WEBSITE
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong !!',
    msg: err.message,
  });
};

// handaling error of production
const sendErrorProd = (err, req, res, next) => {
  // API errors
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // Programming or unknown error
    console.error('ERROR 💥', err);

    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }

  // Rendered website errors

  // Operational, trusted error
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }

  // Programming or unknown error
  console.error('ERROR 💥', err);

  return res.status(500).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res, next);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    sendErrorProd(error, req, res);

    if (error.name === 'JsonWebToken') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError')
      error = handleJWTExpiredError(error);
  }
};
