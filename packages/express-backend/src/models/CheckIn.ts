import mongoose, { Document, Schema } from 'mongoose';
import Student from './Student.js';

export interface ICheckIn extends Document {
  studentId: mongoose.Types.ObjectId;
  termId: mongoose.Types.ObjectId;
  type: 'in' | 'out';
  timestamp: Date;
  isManual: boolean;
}

const checkInSchema: Schema<ICheckIn> = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  termId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Term',
    required: true,
  },
  type: {
    type: String,
    enum: ['in', 'out'],
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  isManual: {
    type: Boolean,
    default: false,
  },
});

// Index for efficient queries
checkInSchema.index({ studentId: 1, termId: 1 });
checkInSchema.index({ timestamp: 1 });

// Middleware to update student status based on check-in type
checkInSchema.post('save', async function (doc) {
  if (doc.type === 'in') {
    await Student.updateOne({ _id: doc.studentId }, { status: 'active' }).exec();
  } else if (doc.type === 'out') {
    await Student.updateOne({ _id: doc.studentId }, { status: 'inactive' }).exec();
  }
});

export default mongoose.model<ICheckIn>('CheckIn', checkInSchema);
