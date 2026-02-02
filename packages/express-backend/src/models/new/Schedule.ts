import mongoose, { Document, Schema } from 'mongoose';

export interface ISchedule extends Document {
  studentId: mongoose.Types.ObjectId;
  termId: mongoose.Types.ObjectId;

  /** Explicit timezone for interpreting availability blocks. */
  timezone: string; // "America/Los_Angeles"

  /** Recommended format for strings: "HH:MM-HH:MM" */
  availability: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
  };

  createdAt: Date;
  updatedAt: Date;
}

const scheduleSchema: Schema<ISchedule> = new mongoose.Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    termId: { type: Schema.Types.ObjectId, ref: 'Term', required: true },

    timezone: { type: String, default: 'America/Los_Angeles' },

    availability: {
      monday: [String],
      tuesday: [String],
      wednesday: [String],
      thursday: [String],
      friday: [String],
    },
  },
  { timestamps: true, collection: 'schedules_v2' }
);

// Exactly one schedule per student per term
scheduleSchema.index({ studentId: 1, termId: 1 }, { unique: true });

export default mongoose.model<ISchedule>('ScheduleV2', scheduleSchema);
