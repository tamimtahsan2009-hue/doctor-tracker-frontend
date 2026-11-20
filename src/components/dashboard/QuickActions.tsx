'use client';

import React from 'react';
import Link from 'next/link';
import { UserPlus, Stethoscope, Users, ArrowUpRight } from 'lucide-react';

interface QuickActionsProps {
  onAddDoctor: () => void;
  onAddPatient: () => void;
}

export function QuickActions({ onAddDoctor, onAddPatient }: QuickActionsProps) {
  const actions = [
    {
      title: 'Add New Doctor',
      desc: 'Register a credentialed physician and custom hospital affiliation',
      icon: Stethoscope,
      onClick: onAddDoctor,
      btnText: 'Register Doctor',
      isModal: true,
    },
    {
      title: 'Add New Patient',
      desc: 'Admit a patient and assign to an attending specialist cohort',
      icon: UserPlus,
      onClick: onAddPatient,
      btnText: 'Admit Patient',
      isModal: true,
    },
    {
      title: 'Doctors Directory',
      desc: 'Browse complete doctor records, filter by hospital & specialty',
      icon: Stethoscope,
      href: '/doctors',
      btnText: 'Open Directory',
      isModal: false,
    },
    {
      title: 'Patients Registry',
      desc: 'Search active medical cases, filter by clinical condition',
      icon: Users,
      href: '/patients',
      btnText: 'Open Registry',
      isModal: false,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8E5] p-5 sm:p-6 shadow-subtle">
      <div className="flex items-center justify-between pb-4 border-b border-[#E2E8E5]">
        <div>
          <h3 className="text-[17px] font-semibold text-[#253746] tracking-tight">
            Administrative Shortcuts
          </h3>
          <p className="text-xs text-[#718096] mt-0.5">
            Frequent clinical operations and rapid data access
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {actions.map((act) => {
          const Icon = act.icon;
          const content = (
            <div className="h-full p-4 rounded-xl border border-[#E2E8E5] hover:border-[#C7DFD9] hover:shadow-card bg-[#F5F7F5]/50 hover:bg-white transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8E5] flex items-center justify-center text-[#176B60] shadow-sm group-hover:bg-[#EAF2EE] transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#718096]/60 group-hover:text-[#176B60] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <h4 className="text-sm font-bold text-[#253746] mt-3 group-hover:text-[#176B60] transition-colors">
                  {act.title}
                </h4>
                <p className="text-xs text-[#718096] mt-1 leading-relaxed">
                  {act.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E2E8E5] flex items-center text-xs font-semibold text-[#176B60]">
                <span>{act.btnText}</span>
              </div>
            </div>
          );

          if (act.isModal) {
            return (
              <button
                key={act.title}
                type="button"
                onClick={act.onClick}
                className="text-left focus:outline-none"
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={act.title} href={act.href!} className="text-left focus:outline-none">
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
