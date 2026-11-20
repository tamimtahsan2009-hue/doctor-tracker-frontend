'use client';

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { 
  HeartPulse, 
  AlertCircle, 
  Users,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PatientStatusCategory {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface PatientStatusDistributionChartProps {
  categories: PatientStatusCategory[];
  totalPatients: number;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function PatientStatusDistributionChart({
  categories,
  totalPatients,
  isLoading,
  error,
  onRetry,
}: PatientStatusDistributionChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as PatientStatusCategory;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-[#C7DFD9] rounded-xl p-3 shadow-elevated text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.color }}
            ></span>
            <span className="font-bold text-[#102B2A]">{data.name}</span>
          </div>
          <div className="pt-1 border-t border-[#E2E8E5] flex items-center justify-between gap-4">
            <span className="text-[#718096]">Admitted Patients:</span>
            <span className="font-bold text-[#253746] font-mono">{data.count}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#718096]">Cohort Share:</span>
            <span className="font-bold text-[#176B60] font-mono">{data.percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8E5] p-5 sm:p-6 shadow-subtle flex flex-col justify-between">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#EAF2EE] border border-[#C7DFD9] flex items-center justify-center text-[#176B60]">
            <HeartPulse className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-[#253746]">
            Patient Status Breakdown
          </h3>
        </div>
        <p className="text-xs text-[#718096] mt-1">
          Proportional triage breakdown across recorded patient health states.
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="h-64 w-full flex flex-col items-center justify-center gap-3 bg-[#F5F7F5] rounded-xl border border-dashed border-[#E2E8E5] animate-pulse">
          <div className="w-8 h-8 border-2 border-[#C7DFD9] border-t-[#176B60] rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-[#718096]">
            Classifying Clinical Status...
          </span>
        </div>
      ) : error ? (
        <div className="h-64 w-full flex flex-col items-center justify-center gap-3 bg-red-50/50 rounded-xl border border-red-200 text-center p-4">
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
      ) : categories.length === 0 || totalPatients === 0 ? (
        <div className="h-64 w-full flex flex-col items-center justify-center gap-2 bg-[#F5F7F5] rounded-xl border border-dashed border-[#E2E8E5] text-center p-6">
          <div className="w-10 h-10 rounded-full bg-white border border-[#E2E8E5] flex items-center justify-center text-[#718096] mb-1">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-[#253746]">No Active Patients</h4>
          <p className="text-[11px] text-[#718096] max-w-xs">
            Add patient records to visualize clinical severity and triage distribution.
          </p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Donut Chart with Center Total Label */}
          <div className="relative w-48 h-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="count"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {categories.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="hover:opacity-85 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-[#102B2A] tracking-tight">
                {totalPatients}
              </span>
              <span className="text-[10px] font-semibold text-[#718096] uppercase tracking-wider">
                Patients
              </span>
            </div>
          </div>

          {/* Color-Coded Clinical Legend */}
          <div className="flex-1 w-full space-y-2">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-[#F5F7F5] hover:bg-[#EAF2EE] border border-[#E2E8E5] transition-colors text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  ></span>
                  <span className="font-semibold text-[#253746] truncate">
                    {cat.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-[#718096] text-[11px]">
                    {cat.percentage}%
                  </span>
                  <span className="font-bold text-[#102B2A] font-mono bg-white px-2 py-0.5 rounded-md border border-[#E2E8E5]">
                    {cat.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

