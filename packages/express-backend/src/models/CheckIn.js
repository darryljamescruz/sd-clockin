const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    clockInTime: { type: Date, required: true },
    clockOutTime: { type: Date }, 
});

module.exports = mongoose.model('CheckIn', checkInSchema);