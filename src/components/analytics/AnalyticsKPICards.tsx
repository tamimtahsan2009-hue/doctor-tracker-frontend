'use client';

import React from 'react';
import { 
  Stethoscope, 
  Users, 
  Activity, 
  UserPlus, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsOverviewData {
  totalDoctors: number;
  totalPatients: number;
  avgPatientsPerDoctor: number;
  newPatientsPeriod: number;
  previousNewPatientsPeriod: number | null;
  growthRate: number | null;
  criticalCases: number;
  seriousCases: number;
  totalSpecializations: number;
}

interface AnalyticsKPICardsProps {
  data: AnalyticsOverviewData | null;
  isLoading: boolean;
  dateRangeLabel: string;
}

export function AnalyticsKPICards({ data, isLoading, dateRangeLabel }: AnalyticsKPICardsProps) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-[#E2E8E5] p-5 animate-pulse space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-20 h-4 bg-slate-200 rounded"></div>
              <div className="w-10 h-10 rounded-xl bg-slate-100"></div>
            </div>
            <div className="w-16 h-8 bg-slate-200 rounded"></div>
            <div className="w-32 h-3 bg-slate-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const {
    totalDoctors,
    totalPatients,
    avgPatientsPerDoctor,
    newPatientsPeriod,
    previousNewPatientsPeriod,
    growthRate,
    totalSpecializations,
  } = data;

  const renderGrowthBadge = () => {
    if (growthRate === null || previousNewPatientsPeriod === null) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#718096] bg-[#F5F7F5] px-2 py-0.5 rounded-md">
          <Minus className="w-3 h-3 text-[#718096]" />
          <span>Active Period</span>
        </span>
      );
    }

    if (growthRate > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
          <TrendingUp className="w-3 h-3 text-emerald-600" />
          <span>+{growthRate}% vs prev</span>
        </span>
      );
    }

    if (growthRate < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
          <TrendingDown className="w-3 h-3 text-amber-600" />
          <span>{growthRate}% vs prev</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#718096] bg-[#F5F7F5] px-2 py-0.5 rounded-md">
        <Minus className="w-3 h-3 text-[#718096]" />
        <span>0% change vs prev</span>
      </span>
    );
  };

  const cards = [
    {
      title: 'Total Doctors',
      value: totalDoctors.toLocaleString(),
      subtitle: `${totalSpecializations} active clinical specializations`,
      badge: 'Licensed Medical Staff',
      icon: Stethoscope,
      iconBg: 'bg-[#EAF2EE] border-[#C7DFD9] text-[#176B60]',
    },
    {
      title: 'Total Patients',
      value: totalPatients.toLocaleString(),
      subtitle: totalPatients > 0 ? 'Cumulative registered patient records' : 'No patients registered yet',
      badge: 'Hospital Cohort',
      icon: Users,
      iconBg: 'bg-[#EAF2EE] border-[#C7DFD9] text-[#176B60]',
    },
    {
      title: 'Avg. Patients per Doctor',
      value: avgPatientsPerDoctor.toString(),
      subtitle: totalDoctors > 0 ? 'Clinical workload distribution ratio' : 'Requires registered doctors',
      badge: 'Workload Index',
      icon: Activity,
      iconBg: 'bg-[#EAF2EE] border-[#C7DFD9] text-[#176B60]',
    },
    {
      title: 'New Registrations',
      value: newPatientsPeriod.toLocaleString(),
      subtitle: `Admitted in ${dateRangeLabel.toLowerCase()}`,
      growthBadge: renderGrowthBadge(),
      icon: UserPlus,
      iconBg: 'bg-[#EAF2EE] border-[#C7DFD9] text-[#176B60]',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-[#E2E8E5] p-5 shadow-subtle hover:border-[#C7DFD9] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-[#718096] uppercase tracking-wider">
                  {card.title}
                </span>
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-sm',
                    card.iconBg
                  )}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-[#253746] tracking-tight">
                  {card.value}
                </span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-[#E2E8E5] flex items-center justify-between text-xs">
              <span className="text-[#718096] truncate max-w-[160px]" title={card.subtitle}>
                {card.subtitle}
              </span>
              {card.growthBadge ? (
                card.growthBadge
              ) : (
                <span className="text-[10px] font-semibold text-[#176B60] bg-[#EAF2EE] px-2 py-0.5 rounded">
                  {card.badge}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

