import mongoose, { Document, Schema } from 'mongoose';

export interface IShift extends Document {
  studentId: mongoose.Types.ObjectId;
  termId: mongoose.Types.ObjectId;
  locationId: mongoose.Types.ObjectId;
  start: Date;
  end: Date;
  status: 'scheduled' | 'started' | 'completed' | 'missed';
  source?: 'manual' | 'recurring';
  notes?: string;
}

const shiftSchema: Schema<IShift> = new Schema<IShift>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  termId: { type: Schema.Types.ObjectId, ref: 'Term', required: true },
  locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  status: {
    type: String,
    enum: ['scheduled', 'started', 'completed', 'missed'],
    default: 'scheduled',
  },
  source: { type: String, enum: ['manual', 'recurring'] },
  notes: { type: String },
});

shiftSchema.index({ studentId: 1, start: 1 });
shiftSchema.index({ locationId: 1, start: 1 });
shiftSchema.index({ termId: 1 });

export default mongoose.model<IShift>('Shift', shiftSchema);


