import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  code: 'GENIUS_BAR' | 'PHONE_ROOM';
  isActive: boolean;
  capacity?: number;
}

const locationSchema: Schema<ILocation> = new Schema<ILocation>({
  name: { type: String, required: true },
  code: {
    type: String,
    enum: ['GENIUS_BAR', 'PHONE_ROOM'],
    required: true,
    unique: true,
  },
  isActive: { type: Boolean, default: true },
  capacity: { type: Number },
});

locationSchema.index({ code: 1 }, { unique: true });
locationSchema.index({ isActive: 1 });

export default mongoose.model<ILocation>('Location', locationSchema);
