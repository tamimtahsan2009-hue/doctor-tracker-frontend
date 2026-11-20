'use client';

import React, { useState } from 'react';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { StatCards } from '@/components/dashboard/StatCards';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AddDoctorModal } from '@/components/modals/AddDoctorModal';
import { AddPatientModal } from '@/components/modals/AddPatientModal';

export default function DashboardPage() {
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in-50">
      {/* Welcome Banner */}
      <WelcomeBanner
        onAddDoctor={() => setIsAddDoctorOpen(true)}
        onAddPatient={() => setIsAddPatientOpen(true)}
      />

      {/* Numerical KPI Cards */}
      <StatCards />

      {/* Data Visualization Section */}
      <AnalyticsCharts />

      {/* Quick Action Shortcuts */}
      <QuickActions
        onAddDoctor={() => setIsAddDoctorOpen(true)}
        onAddPatient={() => setIsAddPatientOpen(true)}
      />

      {/* Recent Administrative Activity & Directory Highlights */}
      <RecentActivity />

      {/* Reusable Modals */}
      <AddDoctorModal
        isOpen={isAddDoctorOpen}
        onClose={() => setIsAddDoctorOpen(false)}
      />

      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
      />
    </div>
  );
}

