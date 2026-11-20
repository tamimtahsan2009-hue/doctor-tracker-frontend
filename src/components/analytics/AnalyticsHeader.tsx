'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  RefreshCw, 
  Clock, 
  Filter, 
  ChevronDown, 
  Sparkles,
  BarChart2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type DateRangePreset = '7d' | '30d' | '90d' | 'year' | 'all' | 'custom';

interface AnalyticsHeaderProps {
  range: DateRangePreset;
  onRangeChange: (range: DateRangePreset) => void;
  startDate: string;
  endDate: string;
  onCustomDateChange: (start: string, end: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string | null;
}

const PRESET_LABELS: { id: DateRangePreset; label: string }[] = [
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: 'year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
];

export function AnalyticsHeader({
  range,
  onRangeChange,
  startDate,
  endDate,
  onCustomDateChange,
  onRefresh,
  isRefreshing,
  lastUpdated,
}: AnalyticsHeaderProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(range === 'custom');
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

  const formatLastUpdated = (iso: string | null) => {
    if (!iso) return 'Just now';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempStart && tempEnd) {
      onCustomDateChange(tempStart, tempEnd);
      onRangeChange('custom');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8E5] p-5 sm:p-6 shadow-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Title & Description */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#EAF2EE] border border-[#C7DFD9] text-[#176B60] text-xs font-semibold">
            <BarChart2 className="w-3.5 h-3.5 text-[#176B60]" />
            <span>Clinical Intelligence & Performance</span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#253746] tracking-tight">
            Analytics & Insights
          </h1>
          <p className="text-xs sm:text-sm text-[#718096] max-w-2xl leading-relaxed">
            Monitor doctor performance, patient distribution, registration trends, and healthcare statistics across active cohorts.
          </p>
        </div>

        {/* Action Controls: Refresh & Last Updated */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-[#718096] bg-[#F5F7F5] px-3 py-1.5 rounded-xl border border-[#E2E8E5]">
            <Clock className="w-3.5 h-3.5 text-[#176B60]" />
            <span>Updated: <strong className="text-[#253746] font-mono">{formatLastUpdated(lastUpdated)}</strong></span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#176B60] bg-white border border-[#C7DFD9] hover:bg-[#EAF2EE] rounded-xl shadow-subtle transition-all disabled:opacity-60"
            title="Reload live analytics from database"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Analytics'}</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8E5] p-3 sm:p-4 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Preset Range Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <div className="flex items-center gap-1 text-xs font-semibold text-[#718096] mr-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#176B60]" />
            <span>Period:</span>
          </div>

          {PRESET_LABELS.map((preset) => {
            const isActive = range === preset.id && !showCustomPicker;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setShowCustomPicker(false);
                  onRangeChange(preset.id);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-[#176B60] text-white shadow-sm'
                    : 'bg-[#F5F7F5] text-[#718096] hover:text-[#253746] hover:bg-[#EAF2EE] border border-[#E2E8E5]'
                )}
              >
                {preset.label}
              </button>
            );
          })}

          <button
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap',
              showCustomPicker || range === 'custom'
                ? 'bg-[#102B2A] text-white shadow-sm'
                : 'bg-[#F5F7F5] text-[#718096] hover:text-[#253746] hover:bg-[#EAF2EE] border border-[#E2E8E5]'
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Custom Range</span>
            <ChevronDown className={cn('w-3 h-3 transition-transform', showCustomPicker && 'rotate-180')} />
          </button>
        </div>

        {/* Selected Period Display Badge */}
        <div className="text-[11px] text-[#718096] font-medium shrink-0 flex items-center gap-1.5 self-end md:self-auto">
          <span>Active filter:</span>
          <span className="font-semibold text-[#176B60] bg-[#EAF2EE] border border-[#C7DFD9] px-2 py-0.5 rounded-md">
            {range === 'custom' ? `${startDate || 'Start'} to ${endDate || 'End'}` : PRESET_LABELS.find((p) => p.id === range)?.label || 'Selected'}
          </span>
        </div>
      </div>

      {/* Expandable Custom Date Picker Form */}
      {showCustomPicker && (
        <form
          onSubmit={handleApplyCustom}
          className="bg-white rounded-2xl border border-[#C7DFD9] p-4 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in-50 zoom-in-98 duration-150"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#718096] mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={tempStart}
                onChange={(e) => setTempStart(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[#F5F7F5] border border-[#E2E8E5] rounded-xl focus:border-[#176B60] focus:ring-1 focus:ring-[#176B60] font-medium text-[#253746]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#718096] mb-1">
                End Date
              </label>
              <input
                type="date"
                value={tempEnd}
                onChange={(e) => setTempEnd(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[#F5F7F5] border border-[#E2E8E5] rounded-xl focus:border-[#176B60] focus:ring-1 focus:ring-[#176B60] font-medium text-[#253746]"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setShowCustomPicker(false)}
              className="px-3 py-1.5 text-xs font-semibold text-[#718096] hover:text-[#253746] bg-white border border-[#E2E8E5] rounded-xl hover:bg-[#F5F7F5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#176B60] hover:bg-[#13564D] rounded-xl shadow-sm transition-all"
            >
              Apply Filter
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

