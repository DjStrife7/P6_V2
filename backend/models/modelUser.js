const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

// We create a schema for the users including their email and password
const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// We apply the validator to the schema before being able to make a model of it
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);