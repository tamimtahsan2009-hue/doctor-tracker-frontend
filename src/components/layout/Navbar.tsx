'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  Menu, 
  Search, 
  Bell, 
  ChevronDown, 
  Shield, 
  LogOut, 
  Stethoscope, 
  Users, 
  BarChart3,
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { cn, getInitials, formatTimeAgo } from '@/lib/utils';

interface NavbarProps {
  onOpenGlobalSearch: () => void;
}

export function Navbar({ onOpenGlobalSearch }: NavbarProps) {
  const pathname = usePathname();
  const { 
    isMobileNavOpen, 
    setIsMobileNavOpen, 
    user, 
    logout,
    activities 
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute breadcrumbs
  const getBreadcrumbs = () => {
    if (pathname === '/dashboard') {
      return { title: 'Dashboard Overview', crumbs: ['Administration', 'Dashboard Overview'] };
    }
    if (pathname.startsWith('/doctors/')) {
      return { title: 'Doctor Profile & Cohort', crumbs: ['Administration', 'Doctors', 'Profile & Cohort'] };
    }
    if (pathname === '/doctors') {
      return { title: 'Doctors Directory', crumbs: ['Administration', 'Doctors Directory'] };
    }
    if (pathname === '/patients') {
      return { title: 'Patients Registry', crumbs: ['Administration', 'Patients Registry'] };
    }
    if (pathname === '/analytics') {
      return { title: 'Analytics & Insights', crumbs: ['Administration', 'Analytics & Insights'] };
    }
    return { title: 'Administration', crumbs: ['Doctor Tracker', 'Portal'] };
  };

  const { title, crumbs } = getBreadcrumbs();

  return (
    <header className={cn(
      'sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8E5] transition-all duration-300 px-3 sm:px-8',
      'flex items-center justify-between gap-2'
    )}>
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="lg:hidden p-2 text-[#718096] hover:text-[#253746] hover:bg-[#F5F7F5] rounded-xl transition-colors shrink-0"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col min-w-0 flex-1">
          {/* Breadcrumbs: visible on tablet/desktop */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#718096] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
            {crumbs.map((crumb, idx) => (
              <React.Fragment key={crumb}>
                {idx > 0 && <span className="text-[#C7DFD9]">/</span>}
                <span className={idx === crumbs.length - 1 ? 'text-[#176B60] font-semibold' : ''}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
          <h1 className="text-base sm:text-[17px] font-bold text-[#253746] tracking-tight truncate leading-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Global Search, Notifications & User Dropdown */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Mobile Search Icon Button */}
        <button
          onClick={onOpenGlobalSearch}
          className="sm:hidden p-2 text-[#718096] hover:text-[#253746] hover:bg-[#F5F7F5] rounded-xl transition-colors shrink-0"
          aria-label="Search physicians & patients"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Desktop Search Trigger Pill */}
        <button
          onClick={onOpenGlobalSearch}
          className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#F5F7F5] hover:bg-[#EAF2EE] text-[#718096] hover:text-[#253746] border border-[#E2E8E5] hover:border-[#C7DFD9] transition-all text-xs font-medium sm:w-64 shrink-0"
        >
          <Search className="w-4 h-4 text-[#718096] shrink-0" />
          <span className="truncate text-[#718096]">Search physicians & patients...</span>
          <span className="hidden sm:inline-block ml-auto px-1.5 py-0.5 text-[10px] bg-white border border-[#E2E8E5] rounded font-mono text-[#718096]">
            Ctrl K
          </span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative shrink-0" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-[#718096] hover:text-[#253746] hover:bg-[#F5F7F5] rounded-xl transition-colors shrink-0"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4 sm:w-4 sm:h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#176B60] ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-elevated border border-[#E2E8E5] overflow-hidden z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-4 py-3 bg-[#F5F7F5] border-b border-[#E2E8E5] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#253746]">Clinical Audit Activity</h3>
                  <p className="text-xs text-[#718096]">Operational record updates</p>
                </div>
                <span className="text-[11px] font-semibold text-[#176B60] bg-[#EAF2EE] border border-[#C7DFD9] px-2 py-0.5 rounded-full">
                  Synchronized
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#E2E8E5]">
                {activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="p-3.5 hover:bg-[#F5F7F5] transition-colors flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF2EE] border border-[#C7DFD9] flex items-center justify-center shrink-0 mt-0.5">
                      {act.iconType === 'doctor' && <Stethoscope className="w-4 h-4 text-[#176B60]" />}
                      {act.iconType === 'patient' && <Users className="w-4 h-4 text-[#176B60]" />}
                      {act.iconType === 'alert' && <AlertCircle className="w-4 h-4 text-amber-600" />}
                      {act.iconType === 'edit' && <CheckCircle2 className="w-4 h-4 text-[#176B60]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#253746]">{act.title}</p>
                      <p className="text-xs text-[#718096] mt-0.5 leading-relaxed">{act.description}</p>
                      <span className="text-[10px] text-[#718096]/80 mt-1 block">
                        {formatTimeAgo(act.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-[#F5F7F5] border-t border-[#E2E8E5] text-center">
                <Link
                  href="/dashboard"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-[#176B60] hover:text-[#13564D]"
                >
                  View full analytics dashboard →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Administrator Profile Dropdown */}
        <div className="relative shrink-0" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-[#F5F7F5] border border-transparent hover:border-[#E2E8E5] transition-all text-left shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-[#102B2A] text-white font-bold text-xs flex items-center justify-center border border-[#1E4442] shadow-sm">
              {getInitials(user?.name || 'Admin')}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-bold text-[#253746] leading-tight">
                {user?.name || 'Admin'}
              </span>
              <span className="text-[11px] text-[#718096] font-medium">
                Clinical Admin
              </span>
            </div>
            <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-[#718096] ml-0.5" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-elevated border border-[#E2E8E5] overflow-hidden z-50 animate-in fade-in-50 zoom-in-95">
              <div className="p-4 border-b border-[#E2E8E5] bg-[#F5F7F5]">
                <div className="text-xs font-semibold text-[#253746]">{user?.name}</div>
                <div className="text-[11px] text-[#718096] truncate">{user?.email}</div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#EAF2EE] border border-[#C7DFD9] text-[#176B60] text-[10px] font-semibold">
                  <Shield className="w-3 h-3 text-[#176B60]" />
                  Verified Administrative Role
                </div>
              </div>

              <div className="p-1.5">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenGlobalSearch();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#253746] hover:bg-[#F5F7F5] rounded-lg transition-colors text-left"
                >
                  <Search className="w-4 h-4 text-[#718096]" />
                  Quick Search Directory
                </button>
                <Link
                  href="/doctors"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#253746] hover:bg-[#F5F7F5] rounded-lg transition-colors"
                >
                  <Stethoscope className="w-4 h-4 text-[#718096]" />
                  Manage Doctors
                </Link>
                <Link
                  href="/patients"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#253746] hover:bg-[#F5F7F5] rounded-lg transition-colors"
                >
                  <Users className="w-4 h-4 text-[#718096]" />
                  Manage Patients
                </Link>
                <Link
                  href="/analytics"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#253746] hover:bg-[#F5F7F5] rounded-lg transition-colors"
                >
                  <BarChart3 className="w-4 h-4 text-[#718096]" />
                  Analytics & Insights
                </Link>
              </div>

              <div className="p-1.5 border-t border-[#E2E8E5]">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  Sign Out Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
