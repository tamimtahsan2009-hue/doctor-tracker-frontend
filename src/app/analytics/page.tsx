'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { AnalyticsHeader, DateRangePreset } from '@/components/analytics/AnalyticsHeader';
import { AnalyticsKPICards } from '@/components/analytics/AnalyticsKPICards';
import { PatientRegistrationTrendsChart } from '@/components/analytics/PatientRegistrationTrendsChart';
import { PatientsPerDoctorChart, DoctorWorkloadItem } from '@/components/analytics/PatientsPerDoctorChart';
import { PatientStatusDistributionChart, PatientStatusCategory } from '@/components/analytics/PatientStatusDistributionChart';
import { SpecializationDistributionChart, SpecializationItem } from '@/components/analytics/SpecializationDistributionChart';
import { apiUrl } from '@/lib/api';

export default function AnalyticsPage() {
  const { doctors, patients } = useApp();

  // Filter state
  const [range, setRange] = useState<DateRangePreset>('30d');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [groupBy, setGroupBy] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showAllDoctors, setShowAllDoctors] = useState(false);

  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [totalTrendsInRange, setTotalTrendsInRange] = useState(0);
  const [doctorWorkload, setDoctorWorkload] = useState<DoctorWorkloadItem[]>([]);
  const [totalDoctorsWorkload, setTotalDoctorsWorkload] = useState(0);
  const [statusCategories, setStatusCategories] = useState<PatientStatusCategory[]>([]);
  const [totalPatientsStatus, setTotalPatientsStatus] = useState(0);
  const [specializations, setSpecializations] = useState<SpecializationItem[]>([]);
  const [totalSpecializationsCount, setTotalSpecializationsCount] = useState(0);

  // Network & UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.set('range', range);
      if (range === 'custom' && startDate && endDate) {
        queryParams.set('startDate', startDate);
        queryParams.set('endDate', endDate);
      }
      if (groupBy) {
        queryParams.set('groupBy', groupBy);
      }

      const doctorParams = new URLSearchParams();
      doctorParams.set('limit', showAllDoctors ? 'all' : '10');

      const [overviewRes, trendsRes, docWorkloadRes, statusRes, specRes] = await Promise.all([
        fetch(apiUrl(`/api/analytics/overview?${queryParams.toString()}`)),
        fetch(apiUrl(`/api/analytics/patient-trends?${queryParams.toString()}`)),
        fetch(apiUrl(`/api/analytics/patients-per-doctor?${doctorParams.toString()}`)),
        fetch(apiUrl(`/api/analytics/patient-status?${queryParams.toString()}`)),
        fetch(apiUrl(`/api/analytics/specializations`)),
      ]);

      const [overviewJson, trendsJson, docWorkloadJson, statusJson, specJson] = await Promise.all([
        overviewRes.json(),
        trendsRes.json(),
        docWorkloadRes.json(),
        statusRes.json(),
        specRes.json(),
      ]);

      if (overviewJson.success) {
        setOverview(overviewJson.data);
      }
      if (trendsJson.success) {
        setTrends(trendsJson.data.trends || []);
        setTotalTrendsInRange(trendsJson.data.totalInRange || 0);
      }
      if (docWorkloadJson.success) {
        setDoctorWorkload(docWorkloadJson.data.doctors || []);
        setTotalDoctorsWorkload(docWorkloadJson.data.totalDoctors || 0);
      }
      if (statusJson.success) {
        setStatusCategories(statusJson.data.categories || []);
        setTotalPatientsStatus(statusJson.data.totalPatients || 0);
      }
      if (specJson.success) {
        setSpecializations(specJson.data.specializations || []);
        setTotalSpecializationsCount(specJson.data.totalSpecializations || 0);
      }

      setLastUpdated(new Date().toISOString());
    } catch (err: any) {
      console.error('Failed to load analytics data:', err);
      setError('Unable to synchronize live clinical analytics. Please check database connectivity.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [range, startDate, endDate, groupBy, showAllDoctors]);

  // Initial fetch and auto-refresh when parameters or underlying cohort change
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, doctors.length, patients.length]);

  const dateRangeLabel = useMemo(() => {
    switch (range) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      case 'year': return 'This Year';
      case 'all': return 'All Time';
      case 'custom': return startDate && endDate ? `${startDate} to ${endDate}` : 'Custom Range';
      default: return 'Selected Period';
    }
  }, [range, startDate, endDate]);

  const handleCustomDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setRange('custom');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Controls, Filters and Refresh */}
      <AnalyticsHeader
        range={range}
        onRangeChange={(r) => {
          setRange(r);
          // Set appropriate default groupBy for UX
          if (r === '7d' || r === '30d') setGroupBy('daily');
          else if (r === '90d') setGroupBy('weekly');
          else if (r === 'year' || r === 'all') setGroupBy('monthly');
        }}
        startDate={startDate}
        endDate={endDate}
        onCustomDateChange={handleCustomDateChange}
        onRefresh={() => fetchAnalytics(true)}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
      />

      {/* 2. Analytical KPI Summary Cards */}
      <AnalyticsKPICards
        data={overview}
        isLoading={isLoading}
        dateRangeLabel={dateRangeLabel}
      />

      {/* 3. Primary Charts Grid: Registration Trends & Doctor Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PatientRegistrationTrendsChart
          trends={trends}
          totalInRange={totalTrendsInRange}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          isLoading={isLoading}
          error={error}
          onRetry={() => fetchAnalytics(true)}
        />

        <PatientsPerDoctorChart
          doctors={doctorWorkload}
          totalDoctors={totalDoctorsWorkload}
          showAll={showAllDoctors}
          onToggleShowAll={() => setShowAllDoctors(!showAllDoctors)}
          isLoading={isLoading}
          error={error}
          onRetry={() => fetchAnalytics(true)}
        />
      </div>

      {/* 4. Secondary Charts Grid: Status Breakdown & Specialization Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PatientStatusDistributionChart
          categories={statusCategories}
          totalPatients={totalPatientsStatus}
          isLoading={isLoading}
          error={error}
          onRetry={() => fetchAnalytics(true)}
        />

        <SpecializationDistributionChart
          specializations={specializations}
          totalDoctors={overview?.totalDoctors || doctors.length}
          totalSpecializations={totalSpecializationsCount}
          isLoading={isLoading}
          error={error}
          onRetry={() => fetchAnalytics(true)}
        />
      </div>
    </div>
  );
}

