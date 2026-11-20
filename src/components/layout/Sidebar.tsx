'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  LayoutDashboard, 
  Stethoscope, 
  Users, 
  BarChart3,
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  Activity,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { 
    isSidebarCollapsed, 
    setIsSidebarCollapsed, 
    isMobileNavOpen, 
    setIsMobileNavOpen, 
    user, 
    logout,
    stats
  } = useApp();

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      title: 'Doctors',
      href: '/doctors',
      icon: Stethoscope,
      badge: stats.totalDoctors > 0 ? stats.totalDoctors : null,
    },
    {
      title: 'Patients',
      href: '/patients',
      icon: Users,
      badge: stats.totalPatients > 0 ? stats.totalPatients : null,
    },
    {
      title: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      badge: null,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#102B2A] text-slate-200 select-none border-r border-[#1E4442]">
      {/* Brand Header */}
      <div
        className={cn(
          'flex items-center h-16 px-4 border-b border-[#1E4442] transition-all duration-300',
          isSidebarCollapsed ? 'justify-center px-2' : 'justify-between'
        )}
      >
        <Link 
          href="/dashboard" 
          className="flex items-center gap-3 group focus:outline-none"
          onClick={() => setIsMobileNavOpen(false)}
        >
          {/* Distinctive Minimal Clinical Monogram */}
          <div className="w-9 h-9 rounded-xl bg-[#176B60] flex items-center justify-center text-white shadow-sm border border-[#529F94]/30 group-hover:bg-[#13564D] transition-colors shrink-0">
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

          {!isSidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[15px] tracking-tight text-white flex items-center gap-1.5 leading-tight">
                Doctor Tracker
                <span className="w-1.5 h-1.5 rounded-full bg-[#529F94]"></span>
              </span>
              <span className="text-[11px] font-medium text-[#9FC4BC] tracking-wider uppercase">
                Clinical Intelligence
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-[#9FC4BC] hover:text-white hover:bg-white/10 transition-colors"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        {!isSidebarCollapsed && (
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#9FC4BC]/70">
            Platform Navigation
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileNavOpen(false)}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#176B60] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.07]',
                isSidebarCollapsed && 'justify-center px-0 py-3'
              )}
              title={isSidebarCollapsed ? item.title : undefined}
            >
              <Icon 
                className={cn(
                  'w-4 h-4 shrink-0 transition-transform duration-150',
                  isActive ? 'text-white' : 'text-[#9FC4BC] group-hover:text-white'
                )} 
              />
              
              {!isSidebarCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate text-[13px]">{item.title}</span>
                  {item.badge !== null && (
                    <span 
                      className={cn(
                        'ml-2 px-2 py-0.5 text-[11px] font-semibold rounded-md tabular-nums',
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'bg-[#163836] text-[#C7DFD9] border border-[#1E4442]'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* System Operational Node Indicator */}
      {!isSidebarCollapsed && (
        <div className="px-3 pb-3">
          <div className="px-3 py-2 rounded-xl bg-[#153634] border border-[#1E4442] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#529F94] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#529F94]"></span>
              </span>
              <span className="text-[11px] font-medium text-[#C7DFD9]">Clinical Node</span>
            </div>
            <span className="text-[10px] text-[#9FC4BC] font-mono">v1.2</span>
          </div>
        </div>
      )}

      {/* User Footer Profile */}
      <div className="p-3 border-t border-[#1E4442]">
        <div 
          className={cn(
            'flex items-center gap-2.5 p-2 rounded-xl bg-[#153634]/60 hover:bg-[#153634] transition-colors',
            isSidebarCollapsed && 'justify-center p-2'
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-[#176B60] border border-[#529F94]/40 flex items-center justify-center font-bold text-xs text-white shrink-0">
            {getInitials(user?.name || 'Admin')}
          </div>
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {user?.name || 'Admin'}
              </div>
              <div className="text-[11px] text-[#9FC4BC] truncate">
                {user?.email || 'admin@doctortracker.health'}
              </div>
            </div>
          )}
          {!isSidebarCollapsed && (
            <button
              onClick={logout}
              className="p-1.5 text-[#9FC4BC] hover:text-red-400 rounded-lg hover:bg-white/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          'hidden lg:block fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out',
          isSidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileNavOpen && (
        <div 
          className="fixed inset-0 bg-[#102B2A]/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-[#102B2A] shadow-2xl lg:hidden transform transition-transform duration-300 ease-in-out',
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
