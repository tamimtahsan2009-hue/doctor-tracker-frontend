'use client';

import React from 'react';
import Link from 'next/link';
import { Patient } from '@/types';
import { useApp } from '@/context/AppContext';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Stethoscope,
  Building2,
  FileText,
  Clock,
  Edit3,
  ExternalLink,
  HeartPulse,
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';

interface PatientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onEdit?: (patient: Patient) => void;
}

export function PatientDetailsModal({
  isOpen,
  onClose,
  patient,
  onEdit,
}: PatientDetailsModalProps) {
  const { doctors } = useApp();

  if (!isOpen || !patient) return null;

  // Resolve doctor
  const assignedDoctor = doctors.find((d) => d.id === patient.doctorId);
  const doctorName = patient.doctorName || assignedDoctor?.name || 'Assigned Specialist';
  const hospitalName = patient.hospital || assignedDoctor?.hospital || 'Hospital / Clinic';

  const getConditionStyle = (condition: string) => {
    switch (condition) {
      case 'Critical':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-600',
        };
      case 'Serious':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-600',
        };
      case 'Stable':
        return {
          bg: 'bg-[#EAF2EE] text-[#176B60] border-[#C7DFD9]',
          dot: 'bg-[#176B60]',
        };
      case 'Recovering':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-600',
        };
      default:
        return {
          bg: 'bg-slate-100 text-[#253746] border-[#E2E8E5]',
          dot: 'bg-[#718096]',
        };
    }
  };

  const conditionStyle = getConditionStyle(patient.condition);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not recorded';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-[#102B2A]/70 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E2E8E5] overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header Bar */}
          <div className="relative bg-[#102B2A] border-b border-[#1E4442] px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#176B60] border border-[#529F94]/30 flex items-center justify-center text-white">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Patient Medical File
                  </h3>
                  <p className="text-[11px] text-[#9FC4BC]">
                    Comprehensive Clinical & Personal Demographics
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-[#153634] text-[#C7DFD9] border border-[#1E4442]">
                  ID: {patient.id}
                </span>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-[#9FC4BC] hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto bg-[#F5F7F5]">
            {/* Top Identity Card */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-xl bg-white border border-[#E2E8E5] shadow-subtle">
              {/* Photo Frame */}
              <div className="shrink-0">
                {patient.avatar ? (
                  <img
                    src={patient.avatar}
                    alt={patient.name}
                    className="w-24 h-28 object-cover rounded-xl border-2 border-[#C7DFD9] shadow-sm"
                  />
                ) : (
                  <div className="w-24 h-28 rounded-xl bg-[#EAF2EE] border border-[#C7DFD9] text-[#176B60] font-bold text-2xl flex flex-col items-center justify-center shadow-sm">
                    <span>{patient.gender === 'Male' ? 'M' : 'F'}</span>
                    <span className="text-[10px] font-normal text-[#718096] mt-1">No Photo</span>
                  </div>
                )}
              </div>

              {/* Bio & Condition */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl font-bold text-[#253746] tracking-tight">
                    {patient.name}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${conditionStyle.bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${conditionStyle.dot}`} />
                    {patient.condition}
                  </span>
                </div>

                <div className="text-xs text-[#718096] mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <span><strong>Age:</strong> {patient.age} years</span>
                  <span>•</span>
                  <span><strong>Gender:</strong> {patient.gender}</span>
                  <span>•</span>
                  <span><strong>Status:</strong> Active Clinical Cohort</span>
                </div>

                {patient.address && (
                  <div className="text-xs text-[#718096] mt-2.5 flex items-start justify-center sm:justify-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#176B60] shrink-0 mt-0.5" />
                    <span>{patient.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Medical Assignment Card */}
              <div className="p-4 rounded-xl bg-white border border-[#E2E8E5] shadow-subtle space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8E5] text-[#253746] font-semibold text-xs uppercase tracking-wider">
                  <Stethoscope className="w-4 h-4 text-[#176B60]" />
                  <span>Assigned Care Team</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-[#718096] text-[11px] block">Attending Specialist</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-semibold text-[#253746] text-sm">{doctorName}</span>
                      {patient.doctorId && (
                        <Link
                          href={`/doctors/${patient.doctorId}`}
                          className="inline-flex items-center gap-1 text-[11px] text-[#176B60] hover:text-[#13564D] font-medium hover:underline"
                        >
                          Doctor Profile
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {assignedDoctor?.specialization && (
                    <div>
                      <span className="text-[#718096] text-[11px] block">Specialization</span>
                      <span className="font-medium text-[#253746]">{assignedDoctor.specialization}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-[#718096] text-[11px] block">Hospital / Healthcare Facility</span>
                    <div className="flex items-center gap-1.5 text-[#253746] font-medium mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-[#718096] shrink-0" />
                      <span>{hospitalName}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[#718096] text-[11px] block">Admission Date</span>
                    <div className="flex items-center gap-1.5 text-[#253746] font-medium mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-[#718096] shrink-0" />
                      <span>{formatDate(patient.admissionDate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information Card */}
              <div className="p-4 rounded-xl bg-white border border-[#E2E8E5] shadow-subtle space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8E5] text-[#253746] font-semibold text-xs uppercase tracking-wider">
                  <Phone className="w-4 h-4 text-[#176B60]" />
                  <span>Contact Demographics</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[#718096] text-[11px] block">Primary Phone Number</span>
                    <a
                      href={`tel:${patient.phone}`}
                      className="font-semibold text-[#176B60] hover:underline flex items-center gap-1.5 mt-0.5 text-sm"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#176B60] shrink-0" />
                      <span>{patient.phone}</span>
                    </a>
                  </div>

                  <div>
                    <span className="text-[#718096] text-[11px] block">Email Address</span>
                    {patient.email ? (
                      <a
                        href={`mailto:${patient.email}`}
                        className="text-[#253746] hover:text-[#176B60] hover:underline flex items-center gap-1.5 mt-0.5 truncate"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#718096] shrink-0" />
                        <span className="truncate">{patient.email}</span>
                      </a>
                    ) : (
                      <span className="text-[#718096] italic text-[11px]">Not provided</span>
                    )}
                  </div>

                  <div>
                    <span className="text-[#718096] text-[11px] block">Residential Address</span>
                    {patient.address ? (
                      <div className="text-[#253746] flex items-start gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#718096] shrink-0 mt-0.5" />
                        <span className="leading-snug">{patient.address}</span>
                      </div>
                    ) : (
                      <span className="text-[#718096] italic text-[11px]">Not provided</span>
                    )}
                  </div>

                  <div>
                    <span className="text-[#718096] text-[11px] block">Record Registered</span>
                    <div className="flex items-center gap-1.5 text-[#718096] text-[11px] mt-0.5">
                      <Clock className="w-3 h-3 text-[#718096] shrink-0" />
                      <span>{formatDate(patient.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Clinical Notes Card */}
            <div className="p-4 rounded-xl bg-white border border-[#E2E8E5] shadow-subtle space-y-2">
              <div className="flex items-center gap-2 text-[#253746] font-semibold text-xs uppercase tracking-wider">
                <FileText className="w-4 h-4 text-[#176B60]" />
                <span>Clinical Notes & Diagnostic Remarks</span>
              </div>
              <div className="bg-[#F5F7F5] p-3 rounded-lg border border-[#E2E8E5] text-xs text-[#253746] leading-relaxed min-h-[60px]">
                {patient.notes ? (
                  <p className="whitespace-pre-line">{patient.notes}</p>
                ) : (
                  <p className="text-[#718096] italic">
                    No clinical observations or additional notes recorded for this patient.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-white border-t border-[#E2E8E5] flex items-center justify-between">
            <span className="text-[11px] text-[#718096]">
              Doctor Tracker • Clinical Patient Record
            </span>

            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(patient)}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#176B60] hover:bg-[#13564D] rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5 text-white" />
                  <span>Edit Record</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#253746] bg-[#F5F7F5] hover:bg-[#EAF2EE] border border-[#E2E8E5] rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </ModalPortal>
  );
}
