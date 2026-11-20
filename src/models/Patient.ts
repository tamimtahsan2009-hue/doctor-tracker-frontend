import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPatient extends Document {
  name: string;
  avatar?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  condition: 'Critical' | 'Serious' | 'Stable' | 'Recovering' | 'Routine Checkup';
  phone: string;
  email?: string;
  address?: string;
  doctorId: mongoose.Types.ObjectId;
  admissionDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    name: { type: String, required: true, trim: true },
    avatar: { type: String, required: false },
    age: { type: Number, required: true, min: 0, max: 150 },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    condition: {
      type: String,
      enum: ['Critical', 'Serious', 'Stable', 'Recovering', 'Routine Checkup'],
      required: true,
      index: true,
    },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    admissionDate: { type: Date, default: Date.now, index: true },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// High-performance search and filter indexes
PatientSchema.index({ doctorId: 1, createdAt: -1 });
PatientSchema.index({ condition: 1, admissionDate: -1 });
PatientSchema.index({ name: 'text', phone: 'text', address: 'text' });

export const Patient: Model<IPatient> =
  mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);
