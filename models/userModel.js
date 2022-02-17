const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide name field!']
  },
  email: {
    type: String,
    lowercase: true,
    required: [true, 'Please provide email field!'],
    unique: true,
    validate: [validator.isEmail, 'please provide a valid email']
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'admin', 'lead-guide'],
    default: 'user'
  },
  password: {
    type: String,
    minLength: 8,
    required: [true, 'Please provide password'],
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide confirm password'],
    // validate work on "SAVE" only
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password does not match'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordExpireToken: Date,
  active: {
    type: String,
    default: true,
    select: false
  }
});

userSchema.pre('save', async function (next) {
  //Check if password is modified
  //is modified is availble on every document
  if (!this.isModified('password')) return next();

  //Hash Password
  this.password = await bcrypt.hash(this.password, 12);

  //Setting confirm password to null
  this.passwordConfirm = undefined;

  next();
});

//this query will run on ever middleware start from find word
userSchema.pre(/^find/, function (next) {
  this.find({ active: true })
  next()
})

userSchema.pre('save', async function (next) {
  //checking if password is not modified or new
  //this is new shows us that this document is new
  if (!this.isModified('password') || this.isNew) return next()

  //somethime jwt is genenrated first and then property is changed
  // so we subtract 1 sec so we can get accuracy and user can logged in back
  this.passwordChangedAt = Date.now() - 1000

  next()
})

userSchema.methods.correctPassword = async function (
  canadiatePassword,
  password
) {
  return await bcrypt.compare(canadiatePassword, password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changesTimeStamp = this.passwordChangedAt.getTime();

    return changesTimeStamp > JWTTimestamp;
  }
  return false;
};

userSchema.methods.generateTokenResetPassword = function () {
  //generating token
  const resetToken = crypto.randomBytes(32).toString('hex');

  //hashing token before saving it in db
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken });
  this.passwordExpireToken = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
