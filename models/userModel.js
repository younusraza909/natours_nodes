const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
      validator: function(el) {
        return el === this.password;
      },
      message: 'Password does not match'
    }
  },
  passwordChangedAt: Date
});

userSchema.pre('save', async function(next) {
  //Check if password is modified
  //is modified is availble on every document
  if (!this.isModified('password')) return next();

  //Hash Password
  this.password = await bcrypt.hash(this.password, 12);

  //Setting confirm password to null
  this.passwordConfirm = undefined;

  next();
});

userSchema.methods.correctPassword = async function(
  canadiatePassword,
  password
) {
  return await bcrypt.compare(canadiatePassword, password);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changesTimeStamp = this.passwordChangedAt.getTime();

    return changesTimeStamp > JWTTimestamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
