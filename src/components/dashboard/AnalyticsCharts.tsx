'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, Stethoscope, Users, UserPlus } from 'lucide-react';

export function AnalyticsCharts() {
  const { doctors, patients } = useApp();

  // 1. Data for Patients per Doctor Bar Chart
  const patientsPerDoctorData = useMemo(() => {
    return doctors.slice(0, 8).map((doc) => {
      const assigned = patients.filter((p) => {
        const pDocId = typeof p.doctorId === 'object' && p.doctorId !== null
          ? ((p.doctorId as any)._id?.toString() || (p.doctorId as any).id)
          : String(p.doctorId);
        return pDocId === doc.id || String(p.doctorId) === doc.id;
      }).length;
      return {
        name: doc.name.replace(/^(Dr\.|Doctor)\s*/i, ''),
        fullName: doc.name,
        specialization: doc.specialization,
        patients: assigned,
      };
    });
  }, [doctors, patients]);

  // 2. Data for Patient Condition Distribution (Donut Chart)
  const conditionDistributionData = useMemo(() => {
    if (patients.length === 0) return [];

    const counts: Record<string, number> = {
      Critical: 0,
      Serious: 0,
      Stable: 0,
      Recovering: 0,
      'Routine Checkup': 0,
    };

    patients.forEach((p) => {
      if (counts[p.condition] !== undefined) {
        counts[p.condition]++;
      }
    });

    // Refined clinical palette: amber and red reserved strictly for warning & critical
    const colors: Record<string, string> = {
      Critical: '#DC2626',      // Red: Critical
      Serious: '#D97706',       // Amber: Serious
      Stable: '#176B60',        // Primary Clinical Green: Stable
      Recovering: '#2A9D8F',    // Secondary Clinical Tone: Recovering
      'Routine Checkup': '#718096', // Neutral secondary: Routine
    };

    return Object.entries(counts)
      .filter(([_, val]) => val > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: colors[name] || '#718096',
        percentage: Math.round((value / patients.length) * 100),
      }));
  }, [patients]);

  const hasDoctors = doctors.length > 0;
  const hasPatients = patients.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Patients Assigned per Doctor Bar Chart (2 Cols) */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8E5] p-5 sm:p-6 shadow-subtle flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E2E8E5]">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#176B60]" />
                <h3 className="text-[17px] font-semibold text-[#253746] tracking-tight">
                  Patients Assigned per Doctor
                </h3>
              </div>
              <p className="text-xs text-[#718096] mt-0.5">
                Active clinical cohort distribution across registered specialists
              </p>
            </div>
            {hasDoctors && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#EAF2EE] text-[#176B60] border border-[#C7DFD9] w-fit">
                {doctors.length} Physicians
              </span>
            )}
          </div>

          <div className="mt-6 h-64 sm:h-72 w-full">
            {!hasDoctors ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-[#F5F7F5]/50 rounded-xl border border-dashed border-[#E2E8E5]">
                <Stethoscope className="w-8 h-8 text-[#9FC4BC] mb-2 stroke-1" />
                <h4 className="text-sm font-semibold text-[#253746]">No Physicians Registered</h4>
                <p className="text-xs text-[#718096] mt-1 max-w-sm">
                  Register doctors to visualize active patient cohort allocation across departments.
                </p>
              </div>
            ) : patientsPerDoctorData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-[#F5F7F5]/50 rounded-xl border border-dashed border-[#E2E8E5]">
                <Users className="w-8 h-8 text-[#9FC4BC] mb-2 stroke-1" />
                <h4 className="text-sm font-semibold text-[#253746]">No Active Assignments</h4>
                <p className="text-xs text-[#718096] mt-1 max-w-sm">
                  Admit patients and assign them to doctors to populate cohort volume analytics.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={patientsPerDoctorData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8E5" />
                  <XAxis
                    dataKey="name"
                    stroke="#718096"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#718096"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#EAF2EE', opacity: 0.5 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-xl shadow-card border border-[#E2E8E5] text-xs">
                            <p className="font-bold text-[#253746]">{data.fullName}</p>
                            <p className="text-[#176B60] text-[11px] font-medium">{data.specialization}</p>
                            <p className="text-[#718096] mt-1.5 pt-1.5 border-t border-[#E2E8E5]">
                              Active Cohort: <strong className="text-[#253746]">{data.patients} patients</strong>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="patients"
                    fill="#176B60"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-[#E2E8E5]/70 flex items-center justify-between text-xs text-[#718096]">
          <span>Provider Allocation Overview</span>
          <span className="font-medium text-[#176B60]">Real-time synchronization</span>
        </div>
      </div>

      {/* 2. Patient Status Breakdown Donut Chart (1 Col) */}
      <div className="bg-white rounded-2xl border border-[#E2E8E5] p-5 sm:p-6 shadow-subtle flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#E2E8E5]">
            <div>
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#176B60]" />
                <h3 className="text-[17px] font-semibold text-[#253746] tracking-tight">
                  Patient Status Breakdown
                </h3>
              </div>
              <p className="text-xs text-[#718096] mt-0.5">
                Clinical triage distribution
              </p>
            </div>
            {hasPatients && (
              <span className="text-[11px] font-semibold text-[#718096]">
                {patients.length} Total
              </span>
            )}
          </div>

          <div className="mt-4 h-56 relative flex items-center justify-center">
            {!hasPatients ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-[#F5F7F5]/50 rounded-xl border border-dashed border-[#E2E8E5] w-full">
                <Users className="w-8 h-8 text-[#9FC4BC] mb-2 stroke-1" />
                <h4 className="text-sm font-semibold text-[#253746]">No Patient Data</h4>
                <p className="text-xs text-[#718096] mt-1">
                  Admit patients to view clinical condition proportions.
                </p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2.5 rounded-xl shadow-card border border-[#E2E8E5] text-xs">
                              <span className="font-bold text-[#253746]">{data.name}</span>: {data.value} ({data.percentage}%)
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={conditionDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {conditionDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Central Stat Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-[#253746] tabular-nums">
                    {patients.length}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#718096]">
                    Patients
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Clean Legend Breakdown */}
          {hasPatients && (
            <div className="space-y-1.5 mt-2">
              {conditionDistributionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-[#F5F7F5] transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-[#253746]">{item.name}</span>
                  </div>
                  <span className="font-semibold text-[#718096] tabular-nums">
                    {item.value} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-[#E2E8E5]/70 flex items-center justify-between text-xs text-[#718096]">
          <span>Triage Status</span>
          <span className="font-medium text-[#176B60]">Live Hospital Data</span>
        </div>
      </div>
    </div>
  );
}
