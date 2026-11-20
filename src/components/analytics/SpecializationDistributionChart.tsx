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
  Stethoscope, 
  AlertCircle, 
  Award,
  Layers
} from 'lucide-react';

export interface SpecializationItem {
  specialization: string;
  count: number;
  percentage: number;
  color: string;
}

interface SpecializationDistributionChartProps {
  specializations: SpecializationItem[];
  totalDoctors: number;
  totalSpecializations: number;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function SpecializationDistributionChart({
  specializations,
  totalDoctors,
  totalSpecializations,
  isLoading,
  error,
  onRetry,
}: SpecializationDistributionChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as SpecializationItem;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-[#C7DFD9] rounded-xl p-3 shadow-elevated text-xs space-y-1 min-w-[190px]">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.color }}
            ></span>
            <p className="font-bold text-[#102B2A]">{data.specialization}</p>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-[#E2E8E5]">
            <span className="text-[#718096]">Clinicians:</span>
            <span className="font-bold text-[#253746] font-mono">{data.count}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#718096]">Faculty Share:</span>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EAF2EE] border border-[#C7DFD9] flex items-center justify-center text-[#176B60]">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#253746]">
              Doctor Specialization Distribution
            </h3>
          </div>
          <p className="text-xs text-[#718096] mt-1">
            Representation across medical subspecialties and departments.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-[#EAF2EE] border border-[#C7DFD9] text-xs font-semibold text-[#176B60] self-start sm:self-auto shrink-0">
          {totalSpecializations} Specializations
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="h-64 w-full flex flex-col items-center justify-center gap-3 bg-[#F5F7F5] rounded-xl border border-dashed border-[#E2E8E5] animate-pulse">
          <div className="w-8 h-8 border-2 border-[#C7DFD9] border-t-[#176B60] rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-[#718096]">
            Mapping Medical Disciplines...
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
      ) : specializations.length === 0 || totalDoctors === 0 ? (
        <div className="h-64 w-full flex flex-col items-center justify-center gap-2 bg-[#F5F7F5] rounded-xl border border-dashed border-[#E2E8E5] text-center p-6">
          <div className="w-10 h-10 rounded-full bg-white border border-[#E2E8E5] flex items-center justify-center text-[#718096] mb-1">
            <Stethoscope className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-[#253746]">No Doctor Specializations Found</h4>
          <p className="text-[11px] text-[#718096] max-w-xs">
            Add doctors with their medical specialties to analyze department representation.
          </p>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={specializations}
              margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8E5" />
              <XAxis
                dataKey="specialization"
                stroke="#718096"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#E2E8E5' }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={40}
              />
              <YAxis
                stroke="#718096"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
                barSize={24}
              >
                {specializations.map((entry, index) => (
                  <Cell
                    key={`spec-cell-${index}`}
                    fill={entry.color}
                    className="hover:opacity-85 transition-opacity"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

