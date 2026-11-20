'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { GlobalSearchModal } from '@/components/modals/GlobalSearchModal';
import { cn } from '@/lib/utils';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isSidebarCollapsed, isAuthChecking } = useApp();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If user is not authenticated and not on login page, redirect to /login
  useEffect(() => {
    if (mounted && !isAuthChecking && !isAuthenticated && pathname !== '/login') {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [mounted, isAuthChecking, isAuthenticated, pathname, router]);

  // When on login page, render clean full-screen layout
  if (pathname === '/login') {
    return (
      <main className="min-h-screen bg-[#F5F7F5] font-sans antialiased text-[#253746]">
        {children}
        <ToastContainer />
      </main>
    );
  }

  // Prevent flash while checking auth
  if (!mounted || isAuthChecking || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-[#C7DFD9] border-t-[#176B60] rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-[#718096] uppercase tracking-wider">
            Securing Clinical Session...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F5] text-[#253746] font-sans antialiased flex flex-col">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 ease-in-out',
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
        <Navbar onOpenGlobalSearch={() => setIsSearchOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <ToastContainer />
    </div>
  );
}
