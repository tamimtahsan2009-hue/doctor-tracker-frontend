'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { 
  Users, 
  Stethoscope, 
  ChevronRight, 
  AlertCircle,
  Building2,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DoctorWorkloadItem {
  id: string;
  fullName: string;
  displayName: string;
  specialization: string;
  hospital: string;
  avatar?: string;
  patientCount: number;
}

interface PatientsPerDoctorChartProps {
  doctors: DoctorWorkloadItem[];
  totalDoctors: number;
  showAll: boolean;
  onToggleShowAll: () => void;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function PatientsPerDoctorChart({
  doctors,
  totalDoctors,
  showAll,
  onToggleShowAll,
  isLoading,
  error,
  onRetry,
}: PatientsPerDoctorChartProps) {
  const chartData = doctors.map((doc) => ({
    ...doc,
    shortName: doc.fullName.replace(/^(Dr\.|Doctor)\s*/i, ''),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DoctorWorkloadItem & { shortName: string };
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-[#C7DFD9] rounded-xl p-3 shadow-elevated text-xs space-y-1.5 min-w-[200px]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#EAF2EE] border border-[#C7DFD9] flex items-center justify-center text-[#176B60] shrink-0 font-bold text-[10px]">
              Dr
            </div>
            <p className="font-bold text-[#102B2A] leading-tight truncate">
              {data.displayName}
            </p>
          </div>
          <div className="text-[11px] text-[#718096] space-y-0.5 pt-1 border-t border-[#E2E8E5]">
            <p className="flex items-center gap-1.5">
              <Stethoscope className="w-3 h-3 text-[#176B60]" />
              <span className="truncate">{data.specialization}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-[#718096]" />
              <span className="truncate">{data.hospital}</span>
            </p>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-[#E2E8E5]">
            <span className="text-[#718096]">Assigned Patients:</span>
            <span className="font-bold text-[#176B60] text-sm font-mono">
              {data.patientCount}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const chartHeight = Math.max(280, chartData.length * 36);

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8E5] p-5 sm:p-6 shadow-subtle flex flex-col justify-between">
      {/* Header with Title & View All Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EAF2EE] border border-[#C7DFD9] flex items-center justify-center text-[#176B60]">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#253746]">
              Patients Assigned per Doctor
            </h3>
          </div>
          <p className="text-xs text-[#718096] mt-1">
            Workload distribution showing cohort allocation for registered physicians.
          </p>
        </div>

        {totalDoctors > 10 && (
          <button
            onClick={onToggleShowAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#176B60] bg-[#EAF2EE] hover:bg-[#D5E5DE] border border-[#C7DFD9] rounded-xl transition-all self-start sm:self-auto"
          >
            <span>{showAll ? 'Show Top 10' : `View All (${totalDoctors})`}</span>
            <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', showAll && 'rotate-90')} />
          </button>
        )}
      </div>

      {/* Chart Body */}
      {isLoading ? (
        <div className="h-72 w-full flex flex-col items-center justify-center gap-3 bg-[#F5F7F5] rounded-xl border border-dashed border-[#E2E8E5] animate-pulse">
          <div className="w-8 h-8 border-2 border-[#C7DFD9] border-t-[#176B60] rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-[#718096]">
            Calculating Physician Workload...
          </span>
        </div>
      ) : error ? (
        <div className="h-72 w-full flex flex-col items-center justify-center gap-3 bg-red-50/50 rounded-xl border border-red-200 text-center p-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-xs font-semibold text-red-700">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          )}
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-72 w-full flex flex-col items-center justify-center gap-2 bg-[#F5F7F5] rounded-xl border border-dashed border-[#E2E8E5] text-center p-6">
          <div className="w-10 h-10 rounded-full bg-white border border-[#E2E8E5] flex items-center justify-center text-[#718096] mb-1">
            <Stethoscope className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-[#253746]">No Doctor Records Available</h4>
          <p className="text-[11px] text-[#718096] max-w-xs">
            Register doctors into the clinical directory to monitor patient assignments and workload.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-y-auto max-h-[380px] pr-2">
          <div style={{ height: `${chartHeight}px`, minHeight: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8E5" />
                <XAxis
                  type="number"
                  stroke="#718096"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8E5' }}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="shortName"
                  type="category"
                  stroke="#253746"
                  fontSize={11}
                  fontWeight={500}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8E5' }}
                  width={110}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="patientCount"
                  fill="#176B60"
                  radius={[0, 6, 6, 0]}
                  barSize={18}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.patientCount > 0 ? '#176B60' : '#D5E5DE'}
                      className="hover:opacity-85 transition-opacity"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

