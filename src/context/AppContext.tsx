'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Doctor, Patient, ActivityItem, User, DashboardStats } from '@/types';
import { apiUrl } from '@/lib/api';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface AppContextType {
  doctors: Doctor[];
  patients: Patient[];
  activities: ActivityItem[];
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthChecking: boolean;
  isDbConnected: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
  addDoctor: (doctor: Omit<Doctor, 'id' | 'createdAt' | 'patientCount'>) => Promise<void>;
  bulkAddDoctors: (doctors: any[]) => Promise<{ success: boolean; insertedCount: number; errors?: string[] }>;
  updateDoctor: (id: string, updates: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => Promise<void>;
  bulkAddPatients: (patients: any[]) => Promise<{ success: boolean; insertedCount: number; errors?: string[] }>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  getDoctorById: (id: string) => Doctor | undefined;
  getPatientsByDoctorId: (doctorId: string) => Patient[];
  stats: DashboardStats;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (c: boolean) => void;
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (o: boolean) => void;
}

const DEFAULT_USER: User = {
  id: 'usr-admin-1',
  name: 'Admin',
  email: 'admin@doctortracker.health',
  role: 'Administrator',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(false);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch doctors and patients from MongoDB API (only when authenticated)
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [docRes, patRes, actRes] = await Promise.all([
        fetch(apiUrl('/api/doctors'), { credentials: 'include' }),
        fetch(apiUrl('/api/patients'), { credentials: 'include' }),
        fetch(apiUrl('/api/analytics'), { credentials: 'include' }),
      ]);

      if (docRes.ok && patRes.ok) {
        const docJson = await docRes.json();
        const patJson = await patRes.json();
        const actJson = actRes.ok ? await actRes.json() : null;

        if (docJson.success) setDoctors(docJson.data || []);
        if (patJson.success) setPatients(patJson.data || []);
        if (actJson?.success && actJson.activities) setActivities(actJson.activities);
        setIsDbConnected(true);
      } else {
        setIsDbConnected(false);
      }
    } catch {
      setIsDbConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial session restoration on mount
  useEffect(() => {
    let isMounted = true;

    async function checkAuthSession() {
      try {
        const res = await fetch(apiUrl('/api/auth/me'), {
          credentials: 'include',
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.user && isMounted) {
            setUser(json.user);
          } else if (isMounted) {
            setUser(null);
          }
        } else if (isMounted) {
          setUser(null);
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) {
          setIsAuthChecking(false);
        }
      }
    }

    checkAuthSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize data when user authentication state activates
  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setDoctors([]);
      setPatients([]);
      setActivities([]);
    }
  }, [user, refreshData]);

  // Compute live statistics
  const stats: DashboardStats = useMemo(() => {
    const totalDoctors = doctors.length;
    const totalPatients = patients.length;
    const avgPatientsPerDoctor =
      totalDoctors > 0 ? parseFloat((totalPatients / totalDoctors).toFixed(1)) : 0;
    const criticalPatients = patients.filter((p) => p.condition === 'Critical').length;

    return {
      totalDoctors,
      totalPatients,
      avgPatientsPerDoctor,
      newRecordsThisMonth: totalDoctors + totalPatients,
      criticalPatients,
      doctorsTrend: totalDoctors,
      patientsTrend: totalPatients,
    };
  }, [doctors, patients]);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password: pass }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setUser(json.user);
        addToast({
          type: 'success',
          title: 'Authentication Successful',
          message: `Welcome back, ${json.user.name}. Live clinical session active.`,
        });
        return { success: true };
      } else {
        return { success: false, error: json.error || 'Invalid email or password.' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to connect to authentication server.' };
    }
  };

  const logout = async () => {
    try {
      await fetch(apiUrl('/api/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      });
    } catch (_) {}
    setUser(null);
    setDoctors([]);
    setPatients([]);
    setActivities([]);
    addToast({
      type: 'info',
      title: 'Logged Out',
      message: 'You have been securely signed out of Doctor Tracker.',
    });
    window.location.href = '/login';
  };

  const addDoctor = async (doctorData: Omit<Doctor, 'id' | 'createdAt' | 'patientCount'>) => {
    try {
      const res = await fetch(apiUrl('/api/doctors'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(doctorData),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setDoctors((prev) => [json.data, ...prev.filter((d) => d.id !== json.data.id)]);
        addToast({
          type: 'success',
          title: 'Doctor Saved to MongoDB',
          message: `${json.data.name} persisted to live database.`,
        });
        await refreshData();
      } else {
        addToast({
          type: 'error',
          title: 'Registration Error',
          message: json.error || 'Failed to save doctor to database.',
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const bulkAddDoctors = async (doctorsList: any[]): Promise<{ success: boolean; insertedCount: number; errors?: string[] }> => {
    try {
      const res = await fetch(apiUrl('/api/doctors/bulk'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ doctors: doctorsList }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshData();
        addToast({
          type: 'success',
          title: 'Bulk Import Completed',
          message: `Successfully imported ${data.insertedCount} doctors into MongoDB Atlas.`,
        });
        return { success: true, insertedCount: data.insertedCount, errors: data.errors };
      } else {
        addToast({
          type: 'error',
          title: 'Bulk Import Failed',
          message: data.error || 'Failed to import records.',
        });
        return { success: false, insertedCount: 0, errors: data.details || [data.error] };
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Network Error', message: err.message });
      return { success: false, insertedCount: 0, errors: [err.message] };
    }
  };

  const updateDoctor = async (id: string, updates: Partial<Doctor>) => {
    try {
      const res = await fetch(apiUrl(`/api/doctors/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setDoctors((prev) =>
          prev.map((doc) => (doc.id === id ? { ...doc, ...json.data } : doc))
        );
        addToast({
          type: 'success',
          title: 'Doctor Updated in MongoDB',
          message: 'Records synchronized with live database.',
        });
        await refreshData();
      } else {
        setDoctors((prev) =>
          prev.map((doc) => (doc.id === id ? { ...doc, ...updates } : doc))
        );
      }
    } catch {
      setDoctors((prev) =>
        prev.map((doc) => (doc.id === id ? { ...doc, ...updates } : doc))
      );
    }
  };

  const deleteDoctor = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/api/doctors/${id}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setDoctors((prev) => prev.filter((d) => d.id !== id));
        setPatients((prev) => prev.filter((p) => p.doctorId !== id));
        addToast({
          type: 'info',
          title: 'Doctor Deleted from MongoDB',
          message: 'Clinician and cohorts removed from live database.',
        });
        await refreshData();
      } else {
        setDoctors((prev) => prev.filter((d) => d.id !== id));
      }
    } catch {
      setDoctors((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const addPatient = async (patientData: Omit<Patient, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch(apiUrl('/api/patients'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patientData),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setPatients((prev) => [json.data, ...prev.filter((p) => p.id !== json.data.id)]);
        addToast({
          type: 'success',
          title: 'Patient Saved to MongoDB',
          message: `${json.data.name} enrolled in live database.`,
        });
        await refreshData();
      } else {
        addToast({
          type: 'error',
          title: 'Admission Error',
          message: json.error || 'Failed to save patient to database.',
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const bulkAddPatients = async (patientsList: any[]): Promise<{ success: boolean; insertedCount: number; errors?: string[] }> => {
    try {
      const res = await fetch(apiUrl('/api/patients/bulk'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ patients: patientsList }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshData();
        addToast({
          type: 'success',
          title: 'Bulk Admission Completed',
          message: `Successfully admitted ${data.insertedCount} patients into MongoDB Atlas.`,
        });
        return { success: true, insertedCount: data.insertedCount, errors: data.errors };
      } else {
        addToast({
          type: 'error',
          title: 'Bulk Admission Failed',
          message: data.error || 'Failed to import patient records.',
        });
        return { success: false, insertedCount: 0, errors: data.details || [data.error] };
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Network Error', message: err.message });
      return { success: false, insertedCount: 0, errors: [err.message] };
    }
  };

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    try {
      const res = await fetch(apiUrl(`/api/patients/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const updated = json.data;
        setPatients((prev) =>
          prev.map((pat) => (pat.id === id ? { ...pat, ...updated } : pat))
        );
        addToast({
          type: 'success',
          title: 'Patient Transferred / Updated',
          message: `${updated.name || 'Patient'} clinical assignment updated.`,
        });
        await refreshData();
      } else {
        const targetDoc = updates.doctorId ? doctors.find((d) => d.id === updates.doctorId) : undefined;
        setPatients((prev) =>
          prev.map((pat) => (pat.id === id ? {
            ...pat,
            ...updates,
            ...(targetDoc ? { doctorName: targetDoc.name, hospital: targetDoc.hospital } : {})
          } : pat))
        );
        addToast({
          type: 'error',
          title: 'Update Error',
          message: json.error || 'Failed to update patient record.',
        });
      }
    } catch {
      const targetDoc = updates.doctorId ? doctors.find((d) => d.id === updates.doctorId) : undefined;
      setPatients((prev) =>
        prev.map((pat) => (pat.id === id ? {
          ...pat,
          ...updates,
          ...(targetDoc ? { doctorName: targetDoc.name, hospital: targetDoc.hospital } : {})
        } : pat))
      );
    }
  };

  const deletePatient = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/api/patients/${id}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setPatients((prev) => prev.filter((p) => p.id !== id));
        addToast({
          type: 'info',
          title: 'Patient Removed from MongoDB',
          message: 'Record deleted from live database.',
        });
        await refreshData();
      } else {
        setPatients((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      setPatients((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const getDoctorById = (id: string) => {
    return doctors.find((d) => d.id === id);
  };

  const getPatientsByDoctorId = (doctorId: string) => {
    return patients.filter((p) => {
      const pDocId = typeof p.doctorId === 'object' && p.doctorId !== null
        ? ((p.doctorId as any)._id?.toString() || (p.doctorId as any).id)
        : String(p.doctorId);
      return pDocId === doctorId || String(p.doctorId) === doctorId;
    });
  };

  return (
    <AppContext.Provider
      value={{
        doctors,
        patients,
        activities,
        user,
        isAuthenticated: !!user,
        isLoading,
        isAuthChecking,
        isDbConnected,
        login,
        logout,
        refreshData,
        addDoctor,
        bulkAddDoctors,
        updateDoctor,
        deleteDoctor,
        addPatient,
        bulkAddPatients,
        updatePatient,
        deletePatient,
        getDoctorById,
        getPatientsByDoctorId,
        stats,
        toasts,
        addToast,
        removeToast,
        globalSearch,
        setGlobalSearch,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isMobileNavOpen,
        setIsMobileNavOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
