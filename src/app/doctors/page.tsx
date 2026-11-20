'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Doctor } from '@/types';
import { ALL_BANGLADESH_SPECIALIZATIONS } from '@/lib/specializations';
import { formatDate, getInitials } from '@/lib/utils';
import { AddDoctorModal } from '@/components/modals/AddDoctorModal';
import { EditDoctorModal } from '@/components/modals/EditDoctorModal';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';
import { BulkImportModal } from '@/components/modals/BulkImportModal';
import { 
  Stethoscope, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Trash2, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  Phone,
  Mail,
  Building2,
  Calendar,
  Users,
  X,
  Sparkles,
  Upload,
  MapPin
} from 'lucide-react';

export default function DoctorsPage() {
  const { doctors, patients, deleteDoctor } = useApp();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('All Specializations');
  const [selectedHospital, setSelectedHospital] = useState('All Hospitals');
  const [dateFilter, setDateFilter] = useState<'all' | '30d' | '90d' | 'year'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'patients'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);

  // Dynamic Specializations: includes Bangladesh directory + all registered doctors' specializations
  const availableSpecializations = useMemo(() => {
    const set = new Set<string>();
    // Collect every custom written specialization from registered doctors
    doctors.forEach((doc) => {
      if (doc.specialization && doc.specialization.trim()) {
        set.add(doc.specialization.trim());
      }
    });
    // Add all 180 Bangladesh doctor specializations
    ALL_BANGLADESH_SPECIALIZATIONS.forEach((spec) => set.add(spec));
    return ['All Specializations', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [doctors]);

  // Dynamic Hospitals: ONLY registered doctors' written hospital affiliations appear here
  const availableHospitals = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((doc) => {
      if (doc.hospital && doc.hospital.trim()) {
        set.add(doc.hospital.trim());
      }
    });
    return ['All Hospitals', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [doctors]);

  // Defensive check: reset filter if the selected option is removed
  useEffect(() => {
    if (selectedSpec !== 'All Specializations' && !availableSpecializations.includes(selectedSpec)) {
      setSelectedSpec('All Specializations');
    }
  }, [availableSpecializations, selectedSpec]);

  useEffect(() => {
    if (selectedHospital !== 'All Hospitals' && !availableHospitals.includes(selectedHospital)) {
      setSelectedHospital('All Hospitals');
    }
  }, [availableHospitals, selectedHospital]);

  // Compute patient count per doctor
  const doctorsWithCount = useMemo(() => {
    return doctors.map((doc) => {
      const assignedCount = patients.filter((p) => {
        const pDocId = typeof p.doctorId === 'object' && p.doctorId !== null
          ? ((p.doctorId as any)._id?.toString() || (p.doctorId as any).id)
          : String(p.doctorId);
        return pDocId === doc.id || String(p.doctorId) === doc.id;
      }).length;
      return {
        ...doc,
        patientCount: assignedCount,
      };
    });
  }, [doctors, patients]);

  // Filter & Search Logic (searches name, custom written specialization, hospital, email, phone)
  const filteredDoctors = useMemo(() => {
    return doctorsWithCount.filter((doc) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.specialization.toLowerCase().includes(q) ||
        doc.hospital.toLowerCase().includes(q) ||
        (doc.email && doc.email.toLowerCase().includes(q)) ||
        (doc.address && doc.address.toLowerCase().includes(q)) ||
        doc.phone.includes(q);

      const matchesSpec =
        selectedSpec === 'All Specializations' || doc.specialization.toLowerCase() === selectedSpec.toLowerCase();

      const matchesHospital =
        selectedHospital === 'All Hospitals' || doc.hospital.toLowerCase() === selectedHospital.toLowerCase();

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const docDate = new Date(doc.createdAt).getTime();
        const now = new Date().getTime();
        const diffDays = (now - docDate) / (1000 * 3600 * 24);
        if (dateFilter === '30d' && diffDays > 30) matchesDate = false;
        if (dateFilter === '90d' && diffDays > 90) matchesDate = false;
        if (dateFilter === 'year' && diffDays > 365) matchesDate = false;
      }

      return matchesSearch && matchesSpec && matchesHospital && matchesDate;
    });
  }, [doctorsWithCount, searchQuery, selectedSpec, selectedHospital, dateFilter]);

  // Sorting Logic
  const sortedDoctors = useMemo(() => {
    return [...filteredDoctors].sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortBy === 'patients') {
        const pA = a.patientCount || 0;
        const pB = b.patientCount || 0;
        return sortOrder === 'asc' ? pA - pB : pB - pA;
      }
      // Date sort
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [filteredDoctors, sortBy, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedDoctors.length / pageSize) || 1;
  const paginatedDoctors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedDoctors.slice(start, start + pageSize);
  }, [sortedDoctors, currentPage]);

  const toggleSort = (column: 'name' | 'date' | 'patients') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSpec('All Specializations');
    setSelectedHospital('All Hospitals');
    setDateFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#176B60] uppercase tracking-wider">
            <Stethoscope className="w-4 h-4" />
            <span>Clinical Staff & Specialties</span>
          </div>
          <h2 className="text-[28px] font-bold tracking-tight text-[#253746] mt-0.5 leading-tight">
            Doctors Directory
          </h2>
          <p className="text-sm text-[#718096] mt-0.5">
            Manage licensed medical specialists, custom hospital affiliations, and their assigned patient cohorts.
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
            <Plus className="w-4 h-4" />
            <span>Add New Doctor</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input - Searches across name, written specialization, and written hospital */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, specialization, hospital..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-800 placeholder-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dynamic Specialization Filter - Contains 180+ Bangladesh specializations + registered ones */}
          <div>
            <select
              value={selectedSpec}
              onChange={(e) => {
                setSelectedSpec(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-800 font-medium cursor-pointer"
            >
              {availableSpecializations.map((spec) => (
                <option key={spec} value={spec} className="bg-white text-slate-800 py-1.5">
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Hospital Filter - Contains ONLY registered hospitals from actual doctors */}
          <div>
            <select
              value={selectedHospital}
              onChange={(e) => {
                setSelectedHospital(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-800 font-medium cursor-pointer"
            >
              {availableHospitals.map((hosp) => (
                <option key={hosp} value={hosp} className="bg-white text-slate-800 py-1.5">
                  {hosp}
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
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-slate-700 font-medium"
            >
              <option value="all">All Registration Dates</option>
              <option value="30d">Registered in Past 30 Days</option>
              <option value="90d">Registered in Past 90 Days</option>
              <option value="year">Registered This Year</option>
            </select>
          </div>
        </div>

        {/* Filter Summary and Clear Trigger */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-800">{sortedDoctors.length}</strong> of{' '}
              <strong className="text-slate-800">{doctors.length}</strong> registered doctors
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-brand-600 font-semibold px-2 py-0.5 rounded-full bg-brand-50 border border-brand-200">
              <Sparkles className="w-3 h-3" />
              180+ Specializations Available
            </span>
          </div>

          {(searchQuery || selectedSpec !== 'All Specializations' || selectedHospital !== 'All Hospitals' || dateFilter !== 'all') && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        {paginatedDoctors.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Doctors Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              No doctor profiles match your current search criteria or active filters.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
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
                      <span>Doctor Name</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4">Specialization</th>
                  <th className="py-3.5 px-4">Hospital Affiliation</th>
                  <th className="py-3.5 px-4">
                    <button
                      onClick={() => toggleSort('patients')}
                      className="flex items-center gap-1.5 hover:text-slate-900"
                    >
                      <span>Cohorts</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Contact Details</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">
                    <button
                      onClick={() => toggleSort('date')}
                      className="flex items-center gap-1.5 hover:text-slate-900"
                    >
                      <span>Registered</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {paginatedDoctors.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Doctor Info */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        {doc.avatar ? (
                          <img
                            src={doc.avatar}
                            alt={doc.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                            {getInitials(doc.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/doctors/${doc.id}`}
                            className="font-bold text-slate-900 hover:text-brand-600 transition-colors block truncate"
                          >
                            {doc.name}
                          </Link>
                          <span className="text-[11px] text-slate-400 block truncate">
                            ID: {doc.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Specialization */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                        {doc.specialization}
                      </span>
                    </td>

                    {/* Hospital */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px] font-medium">{doc.hospital}</span>
                      </div>
                    </td>

                    {/* Assigned Patients Count */}
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/doctors/${doc.id}`}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-semibold border border-slate-200 hover:border-teal-200 transition-colors"
                        title="View assigned patients"
                      >
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{doc.patientCount || 0}</span>
                      </Link>
                    </td>

                    {/* Contact details */}
                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{doc.phone}</span>
                        </div>
                        {doc.email ? (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[170px]">{doc.email}</span>
                          </div>
                        ) : null}
                        {doc.address ? (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[170px]">{doc.address}</span>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {/* Registration Date */}
                    <td className="py-3.5 px-4 hidden lg:table-cell text-slate-500 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(doc.createdAt)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/doctors/${doc.id}`}
                          className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="View Doctor Details & Cohorts"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setEditingDoctor(doc)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Edit Doctor Information"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingDoctor(doc)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Delete Doctor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Pagination Footer */}
        {sortedDoctors.length > 0 && (
          <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing Page <strong className="text-slate-800">{currentPage}</strong> of{' '}
              <strong className="text-slate-800">{totalPages}</strong> ({sortedDoctors.length} total records)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
        type="doctors"
      />

      <AddDoctorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <EditDoctorModal
        isOpen={!!editingDoctor}
        onClose={() => setEditingDoctor(null)}
        doctor={editingDoctor}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingDoctor}
        onClose={() => setDeletingDoctor(null)}
        onConfirm={() => {
          if (deletingDoctor) {
            deleteDoctor(deletingDoctor.id);
            setDeletingDoctor(null);
          }
        }}
        title="Remove Doctor Profile"
        message="Are you sure you want to remove this doctor from the medical directory? Any active patient cohorts will also be unassigned."
        itemName={deletingDoctor?.name}
      />
    </div>
  );
}
