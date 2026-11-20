export type PatientCondition = 'Critical' | 'Serious' | 'Stable' | 'Recovering' | 'Routine Checkup';

export interface Doctor {
  id: string;
  name: string;
  avatar?: string;
  specialization: string;
  hospital: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
  patientCount?: number;
}

export interface Patient {
  id: string;
  name: string;
  avatar?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  condition: PatientCondition;
  phone: string;
  email?: string;
  address?: string;
  doctorId: string;
  doctorName?: string;
  hospital?: string;
  admissionDate: string;
  notes?: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'doctor_added' | 'patient_added' | 'patient_updated' | 'patient_deleted' | 'doctor_updated';
  title: string;
  description: string;
  timestamp: string;
  iconType: 'doctor' | 'patient' | 'edit' | 'alert';
}

export interface DashboardStats {
  totalDoctors: number;
  totalPatients: number;
  avgPatientsPerDoctor: number;
  newRecordsThisMonth: number;
  criticalPatients: number;
  doctorsTrend: number;
  patientsTrend: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Super Admin';
  avatar?: string;
}

