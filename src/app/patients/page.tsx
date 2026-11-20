'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Patient, PatientCondition } from '@/types';
import { CONDITIONS } from '@/lib/mockData';
import { formatDate, getConditionBadgeStyles } from '@/lib/utils';
import { AddPatientModal } from '@/components/modals/AddPatientModal';
import { EditPatientModal } from '@/components/modals/EditPatientModal';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';
import { BulkImportModal } from '@/components/modals/BulkImportModal';
import { PatientDetailsModal } from '@/components/modals/PatientDetailsModal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Phone,
  Mail,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  AlertTriangle,
  HeartPulse,
  Upload,
  MapPin
} from 'lucide-react';

export default function PatientsPage() {
  const { patients, doctors, deletePatient } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('All Conditions');
  const [selectedDoctorId, setSelectedDoctorId] = useState('All Doctors');
  const [dateFilter, setDateFilter] = useState<'all' | '30d' | '90d' | 'year'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'condition' | 'age'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);

  // Check URL query params for ?view=id or ?id=id
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const viewId = params.get('view') || params.get('id');
      if (viewId && patients.length > 0) {
        const target = patients.find((p) => p.id === viewId);
        if (target) setViewingPatient(target);
      }
    }
  }, [patients]);

  // Statistics Summary pills
  const statsSummary = useMemo(() => {
    return {
      total: patients.length,
      critical: patients.filter((p) => p.condition === 'Critical').length,
      serious: patients.filter((p) => p.condition === 'Serious').length,
      stable: patients.filter((p) => p.condition === 'Stable').length,
      recovering: patients.filter((p) => p.condition === 'Recovering').length,
      routine: patients.filter((p) => p.condition === 'Routine Checkup').length,
    };
  }, [patients]);

  // Condition summary pills configuration with high-contrast active and inactive states
  const conditionPills = useMemo(() => [
    {
      id: 'All Conditions',
      label: 'Total Cohort',
      count: statsSummary.total,
      activeBg: 'bg-[#102B2A] border-[#102B2A] text-white shadow-sm ring-2 ring-[#102B2A]/20',
      activeLabel: 'text-[#C7DFD9]',
      activeCount: 'text-white',
      inactiveLabel: 'text-[#718096]',
      inactiveCount: 'text-[#253746]',
    },
    {
      id: 'Critical',
      label: 'Critical',
      count: statsSummary.critical,
      activeBg: 'bg-red-600 border-red-600 text-white shadow-sm ring-2 ring-red-500/20',
      activeLabel: 'text-red-100',
      activeCount: 'text-white',
      inactiveLabel: 'text-red-600',
      inactiveCount: 'text-[#253746]',
    },
    {
      id: 'Serious',
      label: 'Serious',
      count: statsSummary.serious,
      activeBg: 'bg-amber-600 border-amber-600 text-white shadow-sm ring-2 ring-amber-500/20',
      activeLabel: 'text-amber-100',
      activeCount: 'text-white',
      inactiveLabel: 'text-amber-700',
      inactiveCount: 'text-[#253746]',
    },
    {
      id: 'Stable',
      label: 'Stable',
      count: statsSummary.stable,
      activeBg: 'bg-[#176B60] border-[#176B60] text-white shadow-sm ring-2 ring-[#176B60]/20',
      activeLabel: 'text-[#EAF2EE]',
      activeCount: 'text-white',
      inactiveLabel: 'text-[#176B60]',
      inactiveCount: 'text-[#253746]',
    },
    {
      id: 'Recovering',
      label: 'Recovering',
      count: statsSummary.recovering,
      activeBg: 'bg-[#2A9D8F] border-[#2A9D8F] text-white shadow-sm ring-2 ring-[#2A9D8F]/20',
      activeLabel: 'text-emerald-100',
      activeCount: 'text-white',
      inactiveLabel: 'text-[#2A9D8F]',
      inactiveCount: 'text-[#253746]',
    },
    {
      id: 'Routine Checkup',
      label: 'Routine',
      count: statsSummary.routine,
      activeBg: 'bg-[#253746] border-[#253746] text-white shadow-sm ring-2 ring-[#253746]/20',
      activeLabel: 'text-slate-200',
      activeCount: 'text-white',
      inactiveLabel: 'text-[#718096]',
      inactiveCount: 'text-[#253746]',
    },
  ], [statsSummary]);

  // Filter Logic
  const filteredPatients = useMemo(() => {
    return patients.filter((pat) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        pat.name.toLowerCase().includes(q) ||
        pat.phone.includes(q) ||
        (pat.address && pat.address.toLowerCase().includes(q)) ||
        (pat.doctorName && pat.doctorName.toLowerCase().includes(q)) ||
        (pat.notes && pat.notes.toLowerCase().includes(q));

      const matchesCondition =
        selectedCondition === 'All Conditions' || pat.condition === selectedCondition;

      const pDocId = typeof pat.doctorId === 'object' && pat.doctorId !== null
        ? ((pat.doctorId as any)._id?.toString() || (pat.doctorId as any).id)
        : String(pat.doctorId);
      const matchesDoctor =
        selectedDoctorId === 'All Doctors' || pDocId === selectedDoctorId || String(pat.doctorId) === selectedDoctorId;

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const patDate = new Date(pat.admissionDate || pat.createdAt).getTime();
        const now = new Date().getTime();
        const diffDays = (now - patDate) / (1000 * 3600 * 24);
        if (dateFilter === '30d' && diffDays > 30) matchesDate = false;
        if (dateFilter === '90d' && diffDays > 90) matchesDate = false;
        if (dateFilter === 'year' && diffDays > 365) matchesDate = false;
      }

      return matchesSearch && matchesCondition && matchesDoctor && matchesDate;
    });
  }, [patients, searchQuery, selectedCondition, selectedDoctorId, dateFilter]);

  // Sorting
  const sortedPatients = useMemo(() => {
    return [...filteredPatients].sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortBy === 'age') {
        return sortOrder === 'asc' ? a.age - b.age : b.age - a.age;
      }
      if (sortBy === 'condition') {
        return sortOrder === 'asc'
          ? a.condition.localeCompare(b.condition)
          : b.condition.localeCompare(a.condition);
      }
      // Date sort
      const dateA = new Date(a.admissionDate || a.createdAt).getTime();
      const dateB = new Date(b.admissionDate || b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [filteredPatients, sortBy, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedPatients.length / pageSize) || 1;
  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPatients.slice(start, start + pageSize);
  }, [sortedPatients, currentPage]);

  const toggleSort = (column: 'name' | 'date' | 'condition' | 'age') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCondition('All Conditions');
    setSelectedDoctorId('All Doctors');
    setDateFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#176B60] uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Clinical Registry</span>
          </div>
          <h2 className="text-[28px] font-bold tracking-tight text-[#253746] mt-0.5 leading-tight">
            Patient Registry & Records
          </h2>
          <p className="text-sm text-[#718096] mt-0.5">
            Monitor admitted patients, track clinical conditions, and oversee physician cohort assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#E2E8E5] bg-white hover:bg-[#F5F7F5] text-[#253746] text-xs font-semibold shadow-subtle hover:border-[#C7DFD9] transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Upload className="w-4 h-4 text-[#176B60]" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#176B60] hover:bg-[#13564D] text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] w-fit"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Patient</span>
          </button>
        </div>
      </div>

      {/* Patient Statistics Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {conditionPills.map((pill) => {
          const isSelected = selectedCondition === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => {
                setSelectedCondition(pill.id);
                setCurrentPage(1);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? pill.activeBg
                  : 'bg-white border-[#E2E8E5] hover:border-[#C7DFD9] hover:bg-[#F5F7F5]'
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider block ${
                  isSelected ? pill.activeLabel : pill.inactiveLabel
                }`}
              >
                {pill.label}
              </span>
              <span
                className={`text-xl font-extrabold block mt-0.5 tabular-nums ${
                  isSelected ? pill.activeCount : pill.inactiveCount
                }`}
              >
                {pill.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8E5] p-4 shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, doctor, phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-8 py-2 text-xs sm:text-sm bg-[#F5F7F5] border border-[#E2E8E5] rounded-xl focus:bg-white focus:border-[#176B60] focus:ring-2 focus:ring-[#176B60]/10 transition-all text-[#253746] placeholder-[#718096]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[#718096] hover:text-[#253746]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Condition Filter */}
          <div>
            <select
              value={selectedCondition}
              onChange={(e) => {
                setSelectedCondition(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E2E8E5] rounded-xl focus:bg-white focus:border-[#176B60] focus:ring-2 focus:ring-[#176B60]/10 transition-all text-[#253746] font-medium cursor-pointer"
            >
              {CONDITIONS.map((cond) => (
                <option key={cond} value={cond} className="bg-white text-[#253746] py-1.5">
                  {cond}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Filter */}
          <div>
            <select
              value={selectedDoctorId}
              onChange={(e) => {
                setSelectedDoctorId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E2E8E5] rounded-xl focus:bg-white focus:border-[#176B60] focus:ring-2 focus:ring-[#176B60]/10 transition-all text-[#253746] font-medium cursor-pointer"
            >
              <option value="All Doctors" className="bg-white text-[#253746]">All Assigned Doctors</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id} className="bg-white text-[#253746]">
                  {doc.name} ({doc.specialization})
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E2E8E5] rounded-xl focus:bg-white focus:border-[#176B60] focus:ring-2 focus:ring-[#176B60]/10 transition-all text-[#253746] font-medium cursor-pointer"
            >
              <option value="all" className="bg-white text-[#253746]">All Admission Dates</option>
              <option value="30d" className="bg-white text-[#253746]">Admitted in Past 30 Days</option>
              <option value="90d" className="bg-white text-[#253746]">Admitted in Past 90 Days</option>
              <option value="year" className="bg-white text-[#253746]">Admitted This Year</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E2E8E5] text-xs text-[#718096]">
          <span>
            Showing <strong className="text-[#253746]">{sortedPatients.length}</strong> of{' '}
            <strong className="text-[#253746]">{patients.length}</strong> registered patient files
          </span>

          {(searchQuery || selectedCondition !== 'All Conditions' || selectedDoctorId !== 'All Doctors' || dateFilter !== 'all') && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-[#176B60] hover:text-[#13564D] flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8E5] shadow-subtle overflow-hidden">
        {paginatedPatients.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F7F5] border border-[#E2E8E5] flex items-center justify-center text-[#9FC4BC] mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#253746]">No Patient Records Found</h3>
            <p className="text-xs text-[#718096] max-w-sm mt-1">
              No patient files match your active filters or search terms.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-[#F5F7F5] hover:bg-[#EAF2EE] text-[#176B60] border border-[#C7DFD9] text-xs font-semibold rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">
                    <button
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-1.5 hover:text-slate-900"
                    >
                      <span>Patient Details</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4">
                    <button
                      onClick={() => toggleSort('condition')}
                      className="flex items-center gap-1.5 hover:text-slate-900"
                    >
                      <span>Condition</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4">Assigned Doctor</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Contact Phone</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">
                    <button
                      onClick={() => toggleSort('date')}
                      className="flex items-center gap-1.5 hover:text-slate-900"
                    >
                      <span>Admission Date</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {paginatedPatients.map((pat) => {
                  const badge = getConditionBadgeStyles(pat.condition);
                  return (
                    <tr key={pat.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Patient Name & Demographics */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          {pat.avatar ? (
                            <img
                              src={pat.avatar}
                              alt={pat.name}
                              className="w-9 h-9 rounded-xl object-cover border border-teal-200 shadow-sm shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setViewingPatient(pat)}
                              title="Click to view full record"
                            />
                          ) : (
                            <div
                              onClick={() => setViewingPatient(pat)}
                              className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm cursor-pointer hover:bg-teal-100 transition-colors"
                              title="Click to view full record"
                            >
                              {pat.gender === 'Male' ? 'M' : 'F'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <button
                              onClick={() => setViewingPatient(pat)}
                              className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors text-left block hover:underline"
                              title="View full medical profile"
                            >
                              {pat.name}
                            </button>
                            <div className="text-[11px] text-slate-500">
                              {pat.age} yrs • {pat.gender} • <span className="text-slate-400">ID: {pat.id}</span>
                            </div>
                            {pat.address && (
                              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                <MapPin className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                                <span className="truncate max-w-[180px]">{pat.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Condition badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          {pat.condition}
                        </span>
                      </td>

                      {/* Assigned Doctor */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <Link
                            href={`/doctors/${pat.doctorId}`}
                            className="font-semibold text-slate-800 hover:text-brand-600 transition-colors block truncate"
                          >
                            {pat.doctorName || 'Assigned Specialist'}
                          </Link>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {pat.hospital || 'Hospital'}
                          </span>
                        </div>
                      </td>

                      {/* Contact Phone */}
                      <td className="py-3.5 px-4 hidden md:table-cell text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{pat.phone}</span>
                        </div>
                      </td>

                      {/* Admission Date */}
                      <td className="py-3.5 px-4 hidden lg:table-cell text-slate-500 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(pat.admissionDate)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingPatient(pat)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="View All Information"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingPatient(pat)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Edit Patient Record"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingPatient(pat)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Delete Patient Record"
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

        {/* Pagination Footer */}
        {sortedPatients.length > 0 && (
          <div className="px-6 py-4 bg-[#F5F7F5] border-t border-[#E2E8E5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#718096]">
            <div>
              Showing Page <strong className="text-[#253746]">{currentPage}</strong> of{' '}
              <strong className="text-[#253746]">{totalPages}</strong> ({sortedPatients.length} records)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-[#E2E8E5] bg-white hover:bg-[#F5F7F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                      currentPage === pageNum
                        ? 'bg-[#176B60] text-white shadow-sm'
                        : 'bg-white border border-[#E2E8E5] text-[#718096] hover:bg-[#F5F7F5]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-[#E2E8E5] bg-white hover:bg-[#F5F7F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        type="patients"
      />

      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
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

      <ConfirmDeleteModal
        isOpen={!!deletingPatient}
        onClose={() => setDeletingPatient(null)}
        onConfirm={() => {
          if (deletingPatient) {
            deletePatient(deletingPatient.id);
            setDeletingPatient(null);
          }
        }}
        title="Delete Patient Record"
        message="Are you sure you want to permanently delete this patient record? This action cannot be undone."
        itemName={deletingPatient?.name}
      />
    </div>
  );
}

