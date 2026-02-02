import mongoose, { Document, Schema } from 'mongoose';

export interface ICheckIn extends Document {
  studentId: mongoose.Types.ObjectId;
  termId: mongoose.Types.ObjectId;
  shiftId: mongoose.Types.ObjectId;

  type: 'in' | 'out';

  eventAt: Date;
  receivedAt: Date;

  isManual: boolean;
  isAutoClockOut: boolean;

  idempotencyKey: string;
  metadata: Record<string, unknown>;
}

const checkInSchema = new Schema<ICheckIn>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    termId: { type: Schema.Types.ObjectId, ref: 'Term', required: true },
    shiftId: { type: Schema.Types.ObjectId, ref: 'ShiftV2', required: true },

    type: { type: String, enum: ['in', 'out'], required: true },

    eventAt: { type: Date, required: true },
    receivedAt: { type: Date, required: true, default: Date.now },

    isManual: { type: Boolean, default: false },
    isAutoClockOut: { type: Boolean, default: false },

    idempotencyKey: { type: String, required: true },

    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: false, collection: 'checkins_v2' }
);

checkInSchema.index({ idempotencyKey: 1 }, { unique: true });
checkInSchema.index({ shiftId: 1, eventAt: 1 });
checkInSchema.index({ studentId: 1, termId: 1, eventAt: -1 });

export default mongoose.model<ICheckIn>('CheckInV2', checkInSchema);
