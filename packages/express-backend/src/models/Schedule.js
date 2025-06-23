const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    termId: { type: mongoose.Schema.Types.ObjectId, ref: 'Term', required: true }, 
    availability: {
        monday: [String],
        tuesday: [String],
        wednesday: [String],
        thursday: [String],
        friday: [String],
    }   
});

m,odule.exports = mongoose.model('Schedule', scheduleSchema);