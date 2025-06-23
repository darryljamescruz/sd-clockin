const mongoose = require('mongoose');

const termSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  year: { type: Number, required: true }, 
  isActive: { type: Boolean, default: false } 
});

module.exports = mongoose.model('Term', termSchema);