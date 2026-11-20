'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  AlertCircle, 
  UserPlus, 
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendItem {
  date: string;
  label: string;
  count: number;
  cumulative: number;
}

interface PatientRegistrationTrendsChartProps {
  trends: TrendItem[];
  totalInRange: number;
  groupBy: 'daily' | 'weekly' | 'monthly';
  onGroupByChange: (groupBy: 'daily' | 'weekly' | 'monthly') => void;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function PatientRegistrationTrendsChart({
  trends,
  totalInRange,
  groupBy,
  onGroupByChange,
  isLoading,
  error,
  onRetry,
}: PatientRegistrationTrendsChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as TrendItem;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-[#C7DFD9] rounded-xl p-3 shadow-elevated text-xs space-y-1">
          <p className="font-bold text-[#102B2A]">{data.label || label}</p>
          <div className="flex items-center gap-2 pt-1 border-t border-[#E2E8E5]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#176B60]"></span>
            <span className="text-[#718096]">New Registrations:</span>
            <span className="font-bold text-[#253746] font-mono">{data.count}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2A9D8F]"></span>
            <span className="text-[#718096]">Cumulative:</span>
            <span className="font-bold text-[#176B60] font-mono">{data.cumulative}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8E5] p-5 sm:p-6 shadow-subtle flex flex-col justify-between">
      {/* Chart Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EAF2EE] border border-[#C7DFD9] flex items-center justify-center text-[#176B60]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#253746]">
              Patient Registration Trends
            </h3>
          </div>
          <p className="text-xs text-[#718096] mt-1">
            Historical trajectory of admitted patients over the selected observation window.
          </p>
        </div>

        {/* Group By Buttons & Total Counter */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-[#F5F7F5] border border-[#E2E8E5] rounded-xl p-1 text-xs">
            <button
              onClick={() => onGroupByChange('daily')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-semibold transition-all',
                groupBy === 'daily'
                  ? 'bg-white text-[#176B60] shadow-sm'
                  : 'text-[#718096] hover:text-[#253746]'
              )}
            >
              Daily
            </button>
            <button
              onClick={() => onGroupByChange('weekly')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-semibold transition-all',
                groupBy === 'weekly'
                  ? 'bg-white text-[#176B60] shadow-sm'
                  : 'text-[#718096] hover:text-[#253746]'
              )}
            >
              Weekly
            </button>
            <button
              onClick={() => onGroupByChange('monthly')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-semibold transition-all',
                groupBy === 'monthly'
                  ? 'bg-white text-[#176B60] shadow-sm'
                  : 'text-[#718096] hover:text-[#253746]'
              )}
            >
              Monthly
            </button>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-[#EAF2EE] border border-[#C7DFD9] text-xs font-semibold text-[#176B60] shrink-0">
            Total: {totalInRange}
          </div>
        </div>
      </div>

      {/* Body / Chart Area */}
      {isLoading ? (
        <div className="h-72 w-full flex flex-col items-center justify-center gap-3 bg-[#F5F7F5] rounded-xl border border-dashed border-[#E2E8E5] animate-pulse">
          <div className="w-8 h-8 border-2 border-[#C7DFD9] border-t-[#176B60] rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-[#718096]">
            Aggregating Patient Timeline...
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
      ) : trends.length === 0 ? (
        <div className="h-72 w-full flex flex-col items-center justify-center gap-2 bg-[#F5F7F5] rounded-xl border border-dashed border-[#E2E8E5] text-center p-6">
          <div className="w-10 h-10 rounded-full bg-white border border-[#E2E8E5] flex items-center justify-center text-[#718096] mb-1">
            <UserPlus className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-[#253746]">No Registrations in Period</h4>
          <p className="text-[11px] text-[#718096] max-w-xs">
            No patient records were registered during this date range. Try selecting &quot;All Time&quot; or expanding the period.
          </p>
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trends}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="patientTrendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#176B60" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#176B60" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8E5" />
              <XAxis
                dataKey="label"
                stroke="#718096"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E2E8E5' }}
              />
              <YAxis
                stroke="#718096"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#176B60"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#patientTrendGradient)"
                activeDot={{ r: 5, fill: '#176B60', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

