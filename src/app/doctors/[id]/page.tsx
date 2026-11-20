'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Patient } from '@/types';
import { formatDate, getInitials, getConditionBadgeStyles } from '@/lib/utils';
import { AddPatientModal } from '@/components/modals/AddPatientModal';
import { EditPatientModal } from '@/components/modals/EditPatientModal';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';
import { EditDoctorModal } from '@/components/modals/EditDoctorModal';
import { PatientDetailsModal } from '@/components/modals/PatientDetailsModal';
import {
  Stethoscope,
  Building2,
  Phone,
  Mail,
  Calendar,
  Users,
  UserPlus,
  ArrowLeft,
  Eye,
  Edit3,
  Trash2,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  HeartPulse,
  MapPin
} from 'lucide-react';

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params?.id as string;

  const { doctors, patients, deletePatient, deleteDoctor } = useApp();

  const doctor = useMemo(() => {
    return doctors.find((d) => d.id === docId);
  }, [doctors, docId]);

  // Patients assigned to this specific doctor
  const doctorPatients = useMemo(() => {
    return patients.filter((p) => {
      const pDocId = typeof p.doctorId === 'object' && p.doctorId !== null
        ? ((p.doctorId as any)._id?.toString() || (p.doctorId as any).id)
        : String(p.doctorId);
      return pDocId === docId || String(p.doctorId) === docId;
    });
  }, [patients, docId]);

  // Modals state
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [isEditDoctorOpen, setIsEditDoctorOpen] = useState(false);
  const [isDeleteDoctorOpen, setIsDeleteDoctorOpen] = useState(false);

  // Search within doctor's patients
  const [patientSearch, setPatientSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('All');

  const filteredPatients = useMemo(() => {
    return doctorPatients.filter((p) => {
      const q = patientSearch.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.condition.toLowerCase().includes(q);

      const matchesCondition = conditionFilter === 'All' || p.condition === conditionFilter;

      return matchesQuery && matchesCondition;
    });
  }, [doctorPatients, patientSearch, conditionFilter]);

  if (!doctor) {
    return (
      <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Doctor Profile Not Found</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          The requested clinician record may have been removed or does not exist.
        </p>
        <Link
          href="/doctors"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Doctors Directory</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and breadcrumb action */}
      <div>
        <Link
          href="/doctors"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors group mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to All Doctors</span>
        </Link>
      </div>

      {/* Doctor Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-subtle relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Avatar & Identity */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
            {doctor.avatar ? (
              <img
                src={doctor.avatar}
                alt={doctor.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-brand-600 to-navy-800 text-white font-bold text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-md">
                {getInitials(doctor.name)}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-[#253746] leading-tight">
                  {doctor.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF2EE] text-[#176B60] border border-[#C7DFD9]">
                  {doctor.specialization}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Active Provider
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 pt-0.5">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-medium text-slate-800">{doctor.hospital}</span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {doctor.phone}
                </span>
                {doctor.email ? (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {doctor.email}
                  </span>
                ) : null}
                {doctor.address ? (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {doctor.address}
                  </span>
                ) : null}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Member since {formatDate(doctor.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setIsEditDoctorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Details</span>
            </button>
            <button
              onClick={() => setIsDeleteDoctorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Delete Doctor</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar within Doctor Profile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Assigned Patients
            </span>
            <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block tabular-nums">
              {doctorPatients.length}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Critical Cases
            </span>
            <span className="text-2xl font-extrabold text-red-600 mt-0.5 block tabular-nums">
              {doctorPatients.filter((p) => p.condition === 'Critical').length}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Stable / Routine
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-0.5 block tabular-nums">
              {doctorPatients.filter((p) => p.condition === 'Stable' || p.condition === 'Routine Checkup').length}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Care Status
            </span>
            <span className="text-sm font-bold text-teal-600 mt-1.5 block">
              Fully Operational
            </span>
          </div>
        </div>
      </div>

      {/* Associated Patient List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Associated Patient Cohort ({doctorPatients.length})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Patients currently undergoing medical treatment or monitoring under {doctor.name}
            </p>
          </div>

          <button
            onClick={() => setIsAddPatientOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-md shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] w-fit"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Patient to Doctor</span>
          </button>
        </div>

        {/* Patient Filter & Search Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter doctor's patients..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 whitespace-nowrap">Filter Condition:</span>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-[#E2E8E5] bg-white text-[#253746] font-medium focus:bg-white focus:border-[#176B60] focus:ring-2 focus:ring-[#176B60]/10 cursor-pointer"
            >
              <option value="All" className="bg-white text-[#253746]">All Conditions</option>
              <option value="Critical" className="bg-white text-[#253746]">Critical</option>
              <option value="Serious" className="bg-white text-[#253746]">Serious</option>
              <option value="Stable" className="bg-white text-[#253746]">Stable</option>
              <option value="Recovering" className="bg-white text-[#253746]">Recovering</option>
              <option value="Routine Checkup" className="bg-white text-[#253746]">Routine Checkup</option>
            </select>
          </div>
        </div>

        {/* Patient Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          {filteredPatients.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center">
              <Users className="w-10 h-10 text-slate-300 mb-2" />
              <h4 className="text-sm font-bold text-slate-700">No Patients in this Cohort</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-0.5">
                {patientSearch || conditionFilter !== 'All'
                  ? 'No patient matches your search filter.'
                  : `Currently, no active patients are registered under ${doctor.name}.`}
              </p>
              <button
                onClick={() => setIsAddPatientOpen(true)}
                className="mt-4 px-3.5 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition-colors"
              >
                Add First Patient
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-6">Patient Name</th>
                    <th className="py-3 px-4">Condition</th>
                    <th className="py-3 px-4">Demographics</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Admission Date</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredPatients.map((patient) => {
                    const badge = getConditionBadgeStyles(patient.condition);
                    return (
                      <tr key={patient.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-2.5">
                            {patient.avatar ? (
                              <img
                                src={patient.avatar}
                                alt={patient.name}
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-sm shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setViewingPatient(patient)}
                                title="View full patient record"
                              />
                            ) : (
                              <div
                                onClick={() => setViewingPatient(patient)}
                                className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer hover:bg-teal-100 transition-colors"
                                title="View full patient record"
                              >
                                {patient.gender === 'Male' ? 'M' : 'F'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <button
                                onClick={() => setViewingPatient(patient)}
                                className="font-bold text-slate-900 hover:text-teal-700 transition-colors text-left block hover:underline"
                                title="View full medical profile"
                              >
                                {patient.name}
                              </button>
                              {patient.notes && (
                                <div className="text-[11px] text-slate-400 truncate max-w-xs">
                                  {patient.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                            {patient.condition}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {patient.age} yrs • {patient.gender}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {patient.phone}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {formatDate(patient.admissionDate)}
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingPatient(patient)}
                              className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 transition-colors"
                              title="View All Information"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingPatient(patient)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Edit Patient"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingPatient(patient)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Remove Patient"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        defaultDoctorId={doctor.id}
      />

      <PatientDetailsModal
        isOpen={!!viewingPatient}
        onClose={() => setViewingPatient(null)}
        patient={viewingPatient}
        onEdit={(pat) => {
          setViewingPatient(null);
          setEditingPatient(pat);
        }}
      />

      <EditPatientModal
        isOpen={!!editingPatient}
        onClose={() => setEditingPatient(null)}
        patient={editingPatient}
      />

      <EditDoctorModal
        isOpen={isEditDoctorOpen}
        onClose={() => setIsEditDoctorOpen(false)}
        doctor={doctor}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingPatient}
        onClose={() => setDeletingPatient(null)}
        onConfirm={() => {
          if (deletingPatient) {
            deletePatient(deletingPatient.id);
            setDeletingPatient(null);
          }
        }}
        title="Remove Patient Record"
        message="Are you sure you want to remove this patient from the doctor's active cohort?"
        itemName={deletingPatient?.name}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteDoctorOpen}
        onClose={() => setIsDeleteDoctorOpen(false)}
        onConfirm={() => {
          deleteDoctor(doctor.id);
          router.push('/doctors');
        }}
        title="Delete Doctor Profile"
        message="Are you sure you want to permanently delete this doctor and all associated cohort assignments?"
        itemName={doctor.name}
      />
    </div>
  );
}

