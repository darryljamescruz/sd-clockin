import mongoose, { Document, Schema } from 'mongoose';
import Student from './Student';

export interface ICheckIn extends Document {
  studentId: mongoose.Types.ObjectId;
  termId: mongoose.Types.ObjectId;
  // locationId?: mongoose.Types.ObjectId; // commented out for v1.0
  shiftId?: mongoose.Types.ObjectId;
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
  // locationId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Location',
  //   required: false,
  // },
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: false,
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
checkInSchema.index({ studentId: 1, termId: 1, timestamp: 1 });
// checkInSchema.index({ locationId: 1, timestamp: 1 }); // commented out for v1.0

// Middleware to update student status based on check-in type
checkInSchema.post('save', async function (doc) {
  if (doc.type === 'in') {
    await Student.updateOne({ _id: doc.studentId }, { status: 'active' }).exec();
  } else if (doc.type === 'out') {
    await Student.updateOne({ _id: doc.studentId }, { status: 'inactive' }).exec();
  }
});

export default mongoose.model<ICheckIn>('CheckIn', checkInSchema);
