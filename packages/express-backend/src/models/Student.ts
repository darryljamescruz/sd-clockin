import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
  name: string;
  role: string;
  iso: string;
  status: 'incoming' | 'active' | 'inactive';
  // currentLocationId: mongoose.Types.ObjectId | null; // commented out for v1.0
}

const studentSchema: Schema<IStudent> = new mongoose.Schema({
  name: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ['Student Lead', 'Student Assistant'],
  },
  iso: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['incoming', 'active', 'inactive'],
    default: 'incoming',
  },
  // currentLocationId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Location',
  //   default: null,
  // },
});

// Index for efficient queries
studentSchema.index({ iso: 1 });
studentSchema.index({ status: 1 });
// studentSchema.index({ currentLocationId: 1, role: 1 }); // commented out for now

export default mongoose.model<IStudent>('Student', studentSchema);
