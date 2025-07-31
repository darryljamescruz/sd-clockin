import mongoose, { Document, Schema } from 'mongoose';

export interface ITerm extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  year: number;
  isActive: boolean;
}

const termSchema: Schema<ITerm> = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  year: { type: Number, required: true },
  isActive: { type: Boolean, default: false },
});

// Ensure only one active term at a time
termSchema.index({ isActive: 1 });
termSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model<ITerm>('Term', termSchema);
