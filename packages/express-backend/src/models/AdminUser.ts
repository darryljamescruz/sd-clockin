import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
}

const adminUserSchema: Schema<IAdminUser> = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  isAdmin: { type: Boolean, default: true },
});

export default mongoose.model<IAdminUser>('AdminUser', adminUserSchema);
