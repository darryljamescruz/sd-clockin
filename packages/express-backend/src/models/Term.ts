import mongoose, { Document, Schema } from 'mongoose';

export interface ITerm extends Document {
    name: string;
    year: number;
    isActive: boolean;
}

const termSchema: Schema<ITerm> = new mongoose.Schema({
  name: { type: String, required: true }, 
  year: { type: Number, required: true }, 
  isActive: { type: Boolean, default: false } 
});

export default mongoose.model<ITerm>('Term', termSchema); 