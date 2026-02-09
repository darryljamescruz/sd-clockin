import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminUser extends Document {
  email: string;
  emailLower: string;
  name?: string;
  role: 'admin';
  isAdmin: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminUserSchema: Schema<IAdminUser> = new mongoose.Schema({
  email: { type: String, required: true, trim: true },
  emailLower: { type: String, required: true, trim: true },
  name: { type: String, required: false, trim: true },
  role: { type: String, enum: ['admin'], default: 'admin' },
  isAdmin: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date, required: false },
}, { timestamps: true });

adminUserSchema.pre('validate', function normalizeFields(next) {
  if (this.email) {
    this.email = this.email.trim();
    this.emailLower = this.email.toLowerCase();
  }

  if (this.name) {
    this.name = this.name.trim();
  }

  next();
});

adminUserSchema.index({ emailLower: 1 }, { unique: true });
adminUserSchema.index({ isActive: 1 });

export default mongoose.model<IAdminUser>('AdminUser', adminUserSchema);
