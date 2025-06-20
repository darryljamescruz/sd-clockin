const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CheckIn', checkInSchema);