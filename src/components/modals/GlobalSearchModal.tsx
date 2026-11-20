'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Search, Stethoscope, Users, ArrowRight, X } from 'lucide-react';
import { getConditionBadgeStyles } from '@/lib/utils';
import { ModalPortal } from '@/components/ui/ModalPortal';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const { doctors, patients } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  const filteredDoctors = cleanQuery
    ? doctors.filter(
        (d) =>
          d.name.toLowerCase().includes(cleanQuery) ||
          d.specialization.toLowerCase().includes(cleanQuery) ||
          d.hospital.toLowerCase().includes(cleanQuery) ||
          (d.email && d.email.toLowerCase().includes(cleanQuery)) ||
          (d.address && d.address.toLowerCase().includes(cleanQuery))
      )
    : doctors.slice(0, 4);

  const filteredPatients = cleanQuery
    ? patients.filter(
        (p) =>
          p.name.toLowerCase().includes(cleanQuery) ||
          p.phone.includes(cleanQuery) ||
          (p.address && p.address.toLowerCase().includes(cleanQuery)) ||
          p.condition.toLowerCase().includes(cleanQuery) ||
          (p.doctorName && p.doctorName.toLowerCase().includes(cleanQuery))
      )
    : patients.slice(0, 4);

  const handleSelectDoctor = (docId: string) => {
    onClose();
    router.push(`/doctors/${docId}`);
  };

  const handleSelectPatient = (patientId?: string) => {
    onClose();
    if (patientId) {
      router.push(`/patients?view=${patientId}`);
    } else {
      router.push(`/patients`);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#102B2A]/70 backdrop-blur-sm animate-in fade-in-20">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-elevated border border-[#E2E8E5] overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E2E8E5] bg-white">
          <Search className="w-5 h-5 text-[#176B60] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search doctors by name, specialization, hospital, or patients..."
            className="flex-1 text-sm bg-transparent border-0 focus:outline-none text-[#253746] placeholder-[#718096] font-medium"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 text-[#718096] hover:text-[#253746] rounded-lg hover:bg-[#F5F7F5]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded bg-[#F5F7F5] hover:bg-[#EAF2EE] text-[#718096] font-medium"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Doctors Section */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#718096] uppercase tracking-wider mb-2.5 px-2">
              <span className="flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-[#176B60]" />
                Doctors ({filteredDoctors.length})
              </span>
            </div>

            {filteredDoctors.length === 0 ? (
              <p className="text-xs text-[#718096] px-2 py-1">No matching doctors found.</p>
            ) : (
              <div className="space-y-1">
                {filteredDoctors.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleSelectDoctor(doc.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#EAF2EE]/60 border border-transparent hover:border-[#C7DFD9] transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {doc.avatar ? (
                        <img
                          src={doc.avatar}
                          alt={doc.name}
                          className="w-8 h-8 rounded-lg object-cover border border-[#C7DFD9] shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-[#EAF2EE] text-[#176B60] font-bold text-xs flex items-center justify-center shrink-0 border border-[#C7DFD9]">
                          Dr
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#253746] group-hover:text-[#176B60] truncate">
                          {doc.name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#718096] mt-0.5">
                          <span className="font-medium text-[#176B60]">{doc.specialization}</span>
                          <span>•</span>
                          <span className="truncate">{doc.hospital}</span>
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-[#C7DFD9] group-hover:text-[#176B60] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Patients Section */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#718096] uppercase tracking-wider mb-2.5 px-2">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#176B60]" />
                Patients ({filteredPatients.length})
              </span>
            </div>

            {filteredPatients.length === 0 ? (
              <p className="text-xs text-[#718096] px-2 py-1">No matching patients found.</p>
            ) : (
              <div className="space-y-1">
                {filteredPatients.map((pat) => {
                  const badge = getConditionBadgeStyles(pat.condition);
                  return (
                    <button
                      key={pat.id}
                      onClick={() => handleSelectPatient(pat.id)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F5F7F5] border border-transparent hover:border-[#E2E8E5] transition-all text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {pat.avatar ? (
                          <img
                            src={pat.avatar}
                            alt={pat.name}
                            className="w-8 h-8 rounded-lg object-cover border border-[#C7DFD9] shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[#EAF2EE] text-[#176B60] font-bold text-xs flex items-center justify-center shrink-0 border border-[#C7DFD9]">
                            {pat.gender === 'Male' ? 'M' : 'F'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#253746] group-hover:text-[#176B60] truncate">
                            {pat.name} <span className="text-xs text-[#718096] font-normal">({pat.age} yrs)</span>
                          </div>
                          <div className="text-xs text-[#718096] mt-0.5 truncate">
                            Doctor: {pat.doctorName || 'Assigned'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${badge.bg}`}>
                          {pat.condition}
                        </span>
                        <ArrowRight className="w-4 h-4 text-[#C7DFD9] group-hover:text-[#176B60] transition-all shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Shortcut Hints */}
        <div className="p-3 bg-[#F5F7F5] border-t border-[#E2E8E5] flex items-center justify-between text-xs text-[#718096]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-[#E2E8E5] rounded text-[10px] font-mono">↵</kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-[#E2E8E5] rounded text-[10px] font-mono">esc</kbd>
              <span>to close</span>
            </span>
          </div>

          <span className="text-[11px] font-semibold text-[#176B60]">Doctor Tracker Clinical Search</span>
        </div>
      </div>
      </div>
    </ModalPortal>
  );
}
