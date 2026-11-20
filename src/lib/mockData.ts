import { Doctor, Patient, ActivityItem } from '@/types';

// Completely clean system with zero mock/hardcoded data.
// All records, specializations, and hospital affiliations are user-generated and persisted in MongoDB.
export const INITIAL_DOCTORS: Doctor[] = [];
export const INITIAL_PATIENTS: Patient[] = [];
export const INITIAL_ACTIVITIES: ActivityItem[] = [];

// Standard clinical condition tiers required by healthcare management specification
export const CONDITIONS = [
  'All Conditions',
  'Critical',
  'Serious',
  'Stable',
  'Recovering',
  'Routine Checkup',
];
