import mongoose, { Document, Schema } from 'mongoose';

export interface IShift extends Document {
  studentId: mongoose.Types.ObjectId;
  termId: mongoose.Types.ObjectId;
  locationId?: mongoose.Types.ObjectId;
  date: Date; // The date of the shift (without time)
  scheduledStart?: string; // Scheduled start time (HH:MM format)
  scheduledEnd?: string; // Scheduled end time (HH:MM format)
  actualStart?: Date; // Actual clock-in time
  actualEnd?: Date; // Actual clock-out time
  status: 'scheduled' | 'started' | 'completed' | 'missed';
  source?: 'manual' | 'recurring';
  notes?: string;
}

const shiftSchema: Schema<IShift> = new Schema<IShift>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  termId: { type: Schema.Types.ObjectId, ref: 'Term', required: true },
  locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: false },
  date: { type: Date, required: true }, // Date of the shift (without time)
  scheduledStart: { type: String, required: false }, // HH:MM format
  scheduledEnd: { type: String, required: false }, // HH:MM format
  actualStart: { type: Date, required: false }, // Actual clock-in time
  actualEnd: { type: Date, required: false }, // Actual clock-out time
  status: {
    type: String,
    enum: ['scheduled', 'started', 'completed', 'missed'],
    default: 'scheduled',
  },
  source: { type: String, enum: ['manual', 'recurring'] },
  notes: { type: String },
});

shiftSchema.index({ studentId: 1, date: 1 });
shiftSchema.index({ locationId: 1, date: 1 });
shiftSchema.index({ termId: 1 });

export default mongoose.model<IShift>('Shift', shiftSchema);
