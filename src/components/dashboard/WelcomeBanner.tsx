'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Calendar, UserPlus, Stethoscope, Sparkles } from 'lucide-react';

interface WelcomeBannerProps {
  onAddDoctor: () => void;
  onAddPatient: () => void;
}

export function WelcomeBanner({ onAddDoctor, onAddPatient }: WelcomeBannerProps) {
  const { user } = useApp();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-[#E2E8E5] p-5 sm:p-6 shadow-subtle">
      {/* Subtle top edge clinical accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#176B60] via-[#529F94] to-[#102B2A]" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#176B60]">
            <span className="flex items-center gap-1.5 bg-[#EAF2EE] border border-[#C7DFD9] px-2.5 py-0.5 rounded-full">
              <Calendar className="w-3.5 h-3.5" />
              <span>{todayFormatted}</span>
            </span>
            <span className="text-[#C7DFD9]">•</span>
            <span className="text-[11px] text-[#718096] font-medium tracking-wide">
              Clinical Intelligence System
            </span>
          </div>

          <h2 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-[#253746] leading-tight">
            {getGreeting()}, {user?.name || 'Dr. Tahsan Tamim'}
          </h2>

          <p className="text-sm text-[#718096] leading-relaxed">
            Real-time medical staff directory, patient admission cohorts, and hospital specialty distribution.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          <button
            onClick={onAddDoctor}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#176B60] hover:bg-[#13564D] text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Add Doctor</span>
          </button>
          
          <button
            onClick={onAddPatient}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EAF2EE] hover:bg-[#d8e6df] text-[#176B60] border border-[#C7DFD9] text-xs font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Patient</span>
          </button>
        </div>
      </div>
    </div>
  );
}
