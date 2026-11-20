'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Stethoscope, Users, CheckCircle2, AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

export function RecentActivity() {
  const { activities, doctors, patients } = useApp();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 2 Cols: Activity Feed */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8E5] p-5 sm:p-6 shadow-subtle flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#E2E8E5]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#176B60]" />
              <h3 className="text-[17px] font-semibold text-[#253746] tracking-tight">
                Live Administrative Activity
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-[#176B60] bg-[#EAF2EE] border border-[#C7DFD9] px-2.5 py-0.5 rounded-full">
              Audit Feed
            </span>
          </div>

          {activities.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <Clock className="w-8 h-8 text-[#9FC4BC] mb-2 stroke-1" />
              <p className="text-xs font-semibold text-[#253746]">No Administrative Activity Recorded</p>
              <p className="text-[11px] text-[#718096] mt-0.5 max-w-xs">
                New physician registrations, patient admissions, and record updates log here in real-time.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8E5] mt-1">
              {activities.slice(0, 5).map((act) => (
                <div key={act.id} className="py-3 flex items-start gap-3 hover:bg-[#F5F7F5] px-2 rounded-xl transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[#EAF2EE] border border-[#C7DFD9] flex items-center justify-center shrink-0 mt-0.5">
                    {act.iconType === 'doctor' && <Stethoscope className="w-4 h-4 text-[#176B60]" />}
                    {act.iconType === 'patient' && <Users className="w-4 h-4 text-[#176B60]" />}
                    {act.iconType === 'alert' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    {act.iconType === 'edit' && <CheckCircle2 className="w-4 h-4 text-[#176B60]" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#253746]">{act.title}</p>
                      <span className="text-[11px] text-[#718096] font-medium">
                        {formatTimeAgo(act.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-[#718096] mt-0.5 leading-relaxed">
                      {act.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3.5 mt-2 border-t border-[#E2E8E5] flex items-center justify-between text-xs">
          <span className="text-[#718096]">
            {activities.length > 0 ? `Showing last ${Math.min(5, activities.length)} event logs` : 'System idle'}
          </span>
          <Link
            href="/patients"
            className="inline-flex items-center gap-1 font-semibold text-[#176B60] hover:text-[#13564D]"
          >
            Review all patient files <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 1 Col: Quick Directory Highlights */}
      <div className="bg-white rounded-2xl border border-[#E2E8E5] p-5 sm:p-6 shadow-subtle flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#E2E8E5]">
            <h3 className="text-[17px] font-semibold text-[#253746] tracking-tight">
              Directory Snapshot
            </h3>
            <span className="text-xs font-medium text-[#718096]">
              Overview
            </span>
          </div>

          <div className="space-y-3.5 mt-4">
            <div className="p-3.5 rounded-xl bg-[#F5F7F5] border border-[#E2E8E5]">
              <div className="text-xs text-[#718096] font-medium">Newly Registered Specialists</div>
              {doctors.length === 0 ? (
                <p className="text-xs text-[#718096] mt-2 italic">No doctors registered yet.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {doctors.slice(0, 2).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#253746] truncate">{doc.name}</span>
                      <span className="text-[#176B60] font-medium shrink-0 ml-2">{doc.specialization}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-[#F5F7F5] border border-[#E2E8E5]">
              <div className="text-xs text-[#718096] font-medium">High Attention Patient Cohorts</div>
              {patients.filter((p) => p.condition === 'Critical').length === 0 ? (
                <p className="text-xs text-[#718096] mt-2 italic">No critical patient alerts at this time.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {patients
                    .filter((p) => p.condition === 'Critical')
                    .slice(0, 2)
                    .map((pat) => (
                      <div key={pat.id} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#253746] truncate">{pat.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 shrink-0 ml-2">
                          Critical
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#E2E8E5] flex items-center justify-between text-xs text-[#718096]">
          <span>Clinical Snapshot</span>
          <Link href="/doctors" className="font-medium text-[#176B60] hover:underline">
            View directory →
          </Link>
        </div>
      </div>
    </div>
  );
}
