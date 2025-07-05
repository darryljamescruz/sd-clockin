import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
    name: string;
    role: string;
    iso: string;
    scheduleId: mongoose.Types.ObjectId;
}

const studentSchema: Schema<IStudent> = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    iso: { type: String, required: true, unique: true },
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' },
});

export default mongoose.model<IStudent>('Student', studentSchema); 