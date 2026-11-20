import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivity extends Document {
  type: 'doctor_added' | 'patient_added' | 'patient_updated' | 'patient_deleted' | 'doctor_updated' | 'doctor_deleted';
  title: string;
  description: string;
  iconType: 'doctor' | 'patient' | 'edit' | 'alert';
  timestamp: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    type: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    iconType: { type: String, default: 'doctor' },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

export const Activity: Model<IActivity> =
  mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);

