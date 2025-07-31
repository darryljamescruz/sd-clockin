import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
  name: string;
  role: string;
  iso: string;
  status: 'incoming' | 'active' | 'inactive';
}

const studentSchema: Schema<IStudent> = new mongoose.Schema({
  name: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ['Student Lead', 'Assistant'],
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
});

// Index for efficient queries
studentSchema.index({ iso: 1 });
studentSchema.index({ status: 1 });

export default mongoose.model<IStudent>('Student', studentSchema);
