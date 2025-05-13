// models/School.js
const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: String,
  address: String,
  latitude: Number,
  longitude: Number
});

module.exports = mongoose.model('School', schoolSchema);
