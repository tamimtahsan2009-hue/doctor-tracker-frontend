'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  Stethoscope,
  Users
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isAuthChecking } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectParam = searchParams.get('redirect');
  const targetDestination = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/dashboard';

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (!isAuthChecking && isAuthenticated) {
      router.replace(targetDestination);
    }
  }, [isAuthChecking, isAuthenticated, targetDestination, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your administrator email.');
      return;
    }
    if (!password) {
      setError('Please enter your security credentials.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      router.push(targetDestination);
    } else {
      setError(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@doctortracker.health');
    setPassword('AdminSecure2026!');
    setError('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F5F7F5]">
      {/* Left Column: Form & Authentication */}
      <div className="w-full md:w-1/2 lg:w-5/12 flex flex-col justify-between p-6 sm:p-12 lg:p-16 bg-white border-r border-[#E2E8E5]">
        {/* Header / Logo */}
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#176B60] flex items-center justify-center text-white shadow-sm border border-[#529F94]/30">
              <svg 
                className="w-5 h-5 text-white" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M12 4v16" />
                <path d="M4 12h16" />
                <circle cx="12" cy="12" r="9" strokeOpacity="0.3" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-lg text-[#253746] tracking-tight block">
                Doctor Tracker
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[#718096] block -mt-0.5">
                Clinical Intelligence
              </span>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="max-w-sm w-full mx-auto my-12">
          <div className="space-y-2 mb-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EAF2EE] border border-[#C7DFD9] text-[#176B60] text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure Administrative Portal
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#253746]">
              Sign In to Session
            </h1>
            <p className="text-xs sm:text-sm text-[#718096]">
              Enter authorized administrator credentials to access clinical cohorts and medical records.
            </p>
          </div>

          {error && (
            <div className="p-3 mb-5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#253746] block">
                Administrative Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@doctortracker.health"
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#F5F7F5] border border-[#E2E8E5] rounded-xl focus:bg-white focus:border-[#176B60] focus:ring-2 focus:ring-[#176B60]/10 transition-all text-[#253746] placeholder-[#718096]"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#253746] block">
                  Security Passkey
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-[#F5F7F5] border border-[#E2E8E5] rounded-xl focus:bg-white focus:border-[#176B60] focus:ring-2 focus:ring-[#176B60]/10 transition-all text-[#253746] placeholder-[#718096]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#253746]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#176B60] focus:ring-[#176B60] border-[#E2E8E5]"
                />
                <span className="text-xs text-[#718096] font-medium">Keep session authenticated</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#176B60] hover:bg-[#13564D] text-white font-semibold text-sm shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as Administrator</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Demo Fill button */}
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full text-center py-2 text-xs font-semibold text-[#176B60] hover:bg-[#EAF2EE] rounded-xl transition-colors border border-dashed border-[#C7DFD9]"
            >
              Autofill Demo Admin Credentials
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-[11px] text-[#718096] text-center flex items-center justify-center gap-2">
          <span>Doctor Tracker Clinical Intelligence</span>
          <span>•</span>
          <span className="text-[#176B60] font-medium">Authorized Access Only</span>
        </div>
      </div>

      {/* Right Column: Visual Medical Graphic Showcase */}
      <div className="hidden md:flex flex-1 bg-[#102B2A] text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden border-l border-[#1E4442]">
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#153634] border border-[#1E4442] text-xs text-[#C7DFD9]">
            <span className="w-2 h-2 rounded-full bg-[#529F94] animate-pulse"></span>
            <span>Clinical Intelligence System</span>
          </div>
          <span className="text-xs text-[#9FC4BC] font-mono">v1.2</span>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
            Centralized Command for Healthcare Networks
          </h2>
          <p className="text-[#9FC4BC] text-sm leading-relaxed">
            Manage medical specialists, streamline cohort distribution, and access real-time clinical condition analytics across multiple hospital facilities in a single administrative dashboard.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-[#153634] border border-[#1E4442]">
              <Stethoscope className="w-5 h-5 text-[#529F94] mb-2" />
              <div className="text-sm font-bold text-white">Physician Roster</div>
              <div className="text-xs text-[#9FC4BC] mt-1">
                Multi-specialty doctor directories with direct cohort assignment.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#153634] border border-[#1E4442]">
              <Users className="w-5 h-5 text-[#529F94] mb-2" />
              <div className="text-sm font-bold text-white">Patient Registry</div>
              <div className="text-xs text-[#9FC4BC] mt-1">
                Condition-based tracking from Critical ICU to Routine checkups.
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-[#1E4442] flex items-center justify-between text-xs text-[#9FC4BC]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#529F94]" />
            <span>Cryptographic Administrative Authentication</span>
          </div>
          <span>Hospital Administration</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F5F7F5]">
          <div className="w-8 h-8 border-2 border-[#C7DFD9] border-t-[#176B60] rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
