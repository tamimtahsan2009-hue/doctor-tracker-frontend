'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Stethoscope, Users, Activity, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCards() {
  const { stats, doctors, patients } = useApp();

  const criticalCount = patients.filter(
    (p) => p.condition === 'Critical' || p.condition === 'Serious'
  ).length;

  const cards = [
    {
      id: 'total-doctors',
      label: 'Total Doctors',
      value: stats.totalDoctors,
      sublabel: 'Active credentialed physicians',
      icon: Stethoscope,
      trend: stats.totalDoctors > 0 ? `${stats.totalDoctors} Active` : '0 Registered',
      trendLabel: stats.totalDoctors > 0 ? 'In directory' : 'Awaiting records',
      trendPositive: stats.totalDoctors > 0,
      iconContainer: 'bg-[#EAF2EE] text-[#176B60] border-[#C7DFD9]',
    },
    {
      id: 'total-patients',
      label: 'Total Patients',
      value: stats.totalPatients,
      sublabel: 'Enrolled hospital cohorts',
      icon: Users,
      trend: stats.totalPatients > 0 ? `${stats.totalPatients} Admitted` : '0 Admitted',
      trendLabel: stats.totalPatients > 0 ? 'Under care' : 'Awaiting admissions',
      trendPositive: stats.totalPatients > 0,
      iconContainer: 'bg-[#EAF2EE] text-[#176B60] border-[#C7DFD9]',
    },
    {
      id: 'avg-patients',
      label: 'Avg. Patients / Doctor',
      value: stats.avgPatientsPerDoctor,
      sublabel: 'Caseload ratio per specialist',
      icon: Activity,
      trend: stats.totalDoctors > 0 ? `${stats.avgPatientsPerDoctor} Patients` : '0.0',
      trendLabel: 'Per physician',
      trendPositive: true,
      iconContainer: 'bg-[#EAF2EE] text-[#176B60] border-[#C7DFD9]',
    },
    {
      id: 'critical-cases',
      label: 'Critical / Serious Cases',
      value: criticalCount,
      sublabel: 'High-priority clinical triage',
      icon: AlertTriangle,
      trend: `${criticalCount} Cases`,
      trendLabel: criticalCount > 0 ? 'Requires attention' : 'Normal status',
      trendPositive: criticalCount === 0,
      iconContainer: criticalCount > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-[#EAF2EE] text-[#176B60] border-[#C7DFD9]',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="group relative bg-white rounded-2xl border border-[#E2E8E5] p-5 sm:p-6 shadow-subtle hover:border-[#C7DFD9] hover:shadow-card transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] sm:text-[13px] font-semibold text-[#718096]">
                  {card.label}
                </span>
                <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 shrink-0', card.iconContainer)}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-[34px] font-bold tracking-tight text-[#253746] tabular-nums leading-none">
                  {card.value}
                </span>
              </div>

              <p className="text-[12px] text-[#718096] mt-1.5 leading-snug">
                {card.sublabel}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E2E8E5]/70 flex items-center justify-between text-xs">
              <span className={cn(
                'inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-[11px]',
                card.trendPositive 
                  ? 'text-[#176B60] bg-[#EAF2EE]' 
                  : 'text-amber-800 bg-amber-50 border border-amber-200'
              )}>
                {card.trend}
              </span>
              <span className="text-[11px] text-[#718096]">
                {card.trendLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
