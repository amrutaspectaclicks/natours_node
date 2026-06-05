const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../model/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};
const changeToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookiOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRE_COOKIE * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV ==='production') cookiOptions.secure = true;

  res.cookie('jwt', token, cookiOptions);
  //remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const newuser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  // send mail to user
  await new Email(newuser,url).sendWelcome() 
  changeToken(newuser, 201, res);

});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1) check if email and password exist
  if (!email || !password) {
    return next(new AppError('Email or Password are not corerect', 400));
  }

  //2) check if user exist and password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //3) If every ting is correct , send token to client

  changeToken(user, 201, res);

});

exports.logout = (req, res) => {
  res.cookie('jwt', 'logout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};
//middlewear to check user is loged in or not

exports.protect = catchAsync(async (req, res, next) => {
  //get token and check of its there
  let token;
  console.log('authorization:', req.headers.authorization);
console.log('cookies:', req.cookies);
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  console.log('token step 1', token);

  if (!token) {
    return next(
      new AppError('you are not logged in! Please log in to get access', 401),
    );
  }

  //2)varification token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log('STEP 2 decoded:', decoded);
  //3) Check if user still exists

  const currentUser = await User.findById(decoded.id);
    console.log('STEP 3 currentUser:', currentUser);
  if (!currentUser) {
    return next(
      new AppError(
        'the user belongig to this token does not no longer exists',
        401,
      ),
    );
  }
   console.log('STEP 4 passwordChangedAt:', currentUser.passwordChangedAt);

  //4 check if user changed after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User Recentaly changed password! Please log in again', 401),
    );
  }
  console.log('STEP 5 access granted');
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//middelware for to check user is logged in

exports.isLoggedIn = async (req, res, next) => {
  // 1] VERIFY TOKEN
  try {
    if (req.cookies.jwt) {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      //2] CHECK IF USER STILL EXISTS

      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3] CHECK IF USER CHANGE PASSWORD

      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // 4] THERE IS A LOGGED IN USER

      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }

    next();
  };
};
exports.forgetPassword = catchAsync(async (req, res, next) => {
  //1  get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }

  //2 Generate randon reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3 send it to user email
  
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  await new Email(user,resetURL).sendPasswordReset()
    res.status(200).json({
      status: 'success',
      message: 'token sent to email',
    });
  } catch (err) {
    console.log('ERROR', err);
    ((user.passwordResetToken = undefined),
      (user.passwordResetExpires = undefined));
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email.Try Again later!'),
      500,
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) get user based on the token

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2 If token has not expired and there is user,set the new password
  if (!user) {
    return next(new AppError('Token is Invalid or has expired'), 400);
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3 Upadate changedPasswordAt property for the user
  //4 Log the user in,send JWT

  changeToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)get user from collection

  const user = await User.findById(req.user.id).select('+password');

  //2 check if posted current password is correct

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('your current password is wrong', 401));
  }
  //3 if so update password

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4 log user in send jwt
  changeToken(user, 200, res);
});
