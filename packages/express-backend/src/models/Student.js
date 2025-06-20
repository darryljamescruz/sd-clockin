const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    iso: { type: String, required: true, unique: true },
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' },
});

module.exports = mongoose.model('Student', studentSchema);