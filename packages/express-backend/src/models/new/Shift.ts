import mongoose, { Document, Schema } from 'mongoose';

export interface IShift extends Document {
  studentId: mongoose.Types.ObjectId;
  termId: mongoose.Types.ObjectId;

  actualStart: Date;
  actualEnd: Date | null; // null = shift still ongoing

  /** Schedule slot used for comparison (early, overtime, not scheduled). */
  scheduleId?: mongoose.Types.ObjectId;
  scheduledStart?: string; // "HH:MM"
  scheduledEnd?: string; // "HH:MM"

  /** PST date as YYYY-MM-DD for daily queries. */
  dayKeyLabel: string;

  source: 'manual';
  needsReview: boolean;
  notes?: string;
  metadata: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

const shiftSchema = new Schema<IShift>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    termId: { type: Schema.Types.ObjectId, ref: 'Term', required: true },

    actualStart: { type: Date, required: true },
    actualEnd: { type: Date, default: null },

    scheduleId: { type: Schema.Types.ObjectId, ref: 'ScheduleV2' },
    scheduledStart: { type: String },
    scheduledEnd: { type: String },

    dayKeyLabel: { type: String, required: true },

    source: { type: String, enum: ['manual'], default: 'manual' },
    needsReview: { type: Boolean, default: false },
    notes: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'shifts_v2' }
);

// One open shift per student per term
shiftSchema.index(
  { studentId: 1, termId: 1 },
  { unique: true, partialFilterExpression: { actualEnd: null } }
);

shiftSchema.index({ studentId: 1, dayKeyLabel: 1 });
shiftSchema.index({ termId: 1, dayKeyLabel: 1 });

export default mongoose.model<IShift>('ShiftV2', shiftSchema);
