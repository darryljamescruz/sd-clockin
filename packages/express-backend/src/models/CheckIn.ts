import mongoose, { Document, Schema } from 'mongoose';

export interface ICheckIn extends Document {
    studentId: mongoose.Types.ObjectId;
    clockInTime: Date;
    clockOutTime?: Date;
}

const checkInSchema: Schema<ICheckIn> = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    clockInTime: { type: Date, required: true },
    clockOutTime: { type: Date }, 
});

export default mongoose.model<ICheckIn>('CheckIn', checkInSchema); 