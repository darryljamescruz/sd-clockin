import mongoose, { Document, Schema } from 'mongoose';

export interface ISchedule extends Document {
    studentId: mongoose.Types.ObjectId;
    termId: mongoose.Types.ObjectId;
    availability: {
        monday: string[];
        tuesday: string[];
        wednesday: string[];
        thursday: string[];
        friday: string[];

    };
}

const scheduleSchema: Schema<ISchedule> = new mongoose.Schema({
    studentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Student', 
        required: true 
    },
    termId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Term', 
        required: true 
    }, 
    availability: {
        monday: [String],
        tuesday: [String],
        wednesday: [String],
        thursday: [String],
        friday: [String],
    }   
});

// Index for efficient queries
scheduleSchema.index({ studentId: 1, termId: 1 });

export default mongoose.model<ISchedule>('Schedule', scheduleSchema); 