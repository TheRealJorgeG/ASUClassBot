const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  classes: { type: [Number], default: [] }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
