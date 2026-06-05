const crypto = require('crypto')
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs')
const { default: isEmail } = require('validator/lib/isEmail');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name']
  },
  email: {
    type: String,
    required: [true, 'Please provide Email Id'],
    unique:true,
    lowercase:true,
    validator:[validator.isEmail]
  },
  photo:{
    type:String,
    default:'default.jpg'
  },
  role:{
    type:String,
    enum:['user','guide','lead-guide','admin'],
    default:'user'
  },
  password:{
    type:String,
    required:[true,'Please Enter your Password'],
    minlength:8,
    select:false
  },
  passwordConfirm:{
    type:String,
    required:[true,'Confirm Password'],
    validator:{
      //This works only create and save !!!
      validator:function (e){
        return e === this.password;
      },
      message:'Passwords are not same!!'
    }
  },
  passwordChangedAt:Date,
  passwordResetToken:String,
  passwordResetExpires:Date,
  active:{
    type:Boolean,
    default:true,
    select:false
  }

}) 
userSchema.pre('save',async function(next){
  if(!this.isModified('password')) return (next());
  this.password = await bcrypt.hash(this.password,12);
  this.passwordConfirm = undefined
})

userSchema.pre('save',function(next){
  if(!this.isModified('password')|| this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next()
})

userSchema.pre(/^find/,function(next){
this.find({active:{$ne:false}})
next()
})
//mangoose instance method works on every document of user
userSchema.methods.correctPassword = async function(candidatePassword,userPassword){
  return await bcrypt.compare(candidatePassword,userPassword)
}


userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
  if(this.passwordChangedAt){
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000,10);
    //changed passworrd
    return JWTTimestamp < changedTimestamp;
  }
  // not changed password
  return false 
}

userSchema.methods.createPasswordResetToken = function(){
//random token sent to email for verification
  const resetToken = crypto.randomBytes(32).toString('hex')

//create another hashtoken stored in db
this.passwordResetToken = crypto
.createHash('sha256')
.update(resetToken)
.digest('hex')


this.passwordResetExpires= Date.now()+10*60*1000;

return resetToken;
}
const User = mongoose.model('User', userSchema);

module.exports = User;
