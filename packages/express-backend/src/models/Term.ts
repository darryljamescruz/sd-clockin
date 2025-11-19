import mongoose, { Document, Schema } from 'mongoose';

export interface IDayOffRange {
  startDate: Date;
  endDate: Date;
  notes?: string;
}

export interface ITerm extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  year: number;
  isActive: boolean;
  daysOff: IDayOffRange[];
  notes?: string;
}

const dayOffRangeSchema = new mongoose.Schema(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const termSchema: Schema<ITerm> = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  year: { type: Number, required: true },
  isActive: { type: Boolean, default: false },
  daysOff: { type: [dayOffRangeSchema], default: [] },
  notes: { type: String, default: '' },
});

// Ensure only one active term at a time
termSchema.index({ isActive: 1 });
termSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model<ITerm>('Term', termSchema);
