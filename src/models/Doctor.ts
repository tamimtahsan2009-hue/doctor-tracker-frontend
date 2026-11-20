import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDoctor extends Document {
  name: string;
  avatar?: string;
  specialization: string;
  hospital: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true, trim: true },
    avatar: { type: String, required: false },
    specialization: { type: String, required: true, trim: true, index: true },
    hospital: { type: String, required: true, trim: true, index: true },
    phone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true,
      match: [/^01\d{9}$/, 'Please enter a valid 11-digit phone number (e.g. 01712345678)'],
    },
    email: {
      type: String,
      required: false,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// High-performance search and filter indexes
DoctorSchema.index({ name: 'text', specialization: 'text', hospital: 'text', email: 'text', address: 'text' });
DoctorSchema.index({ specialization: 1, hospital: 1, createdAt: -1 });

export const Doctor: Model<IDoctor> =
  mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', DoctorSchema);
