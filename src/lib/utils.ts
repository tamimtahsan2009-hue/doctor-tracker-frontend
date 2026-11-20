import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

export function getInitials(name: string): string {
  if (!name) return 'DR';
  const parts = name.replace(/^(Dr\.|Doctor|Mr\.|Ms\.|Mrs\.)\s*/i, '').trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Premium Clinical Intelligence status badge styling:
 * Restrained palette using soft sage (#EAF2EE), clinical green (#176B60),
 * and reserved amber/red ONLY for warning/critical triage.
 */
export function getConditionBadgeStyles(condition: string) {
  switch (condition) {
    case 'Critical':
      return {
        bg: 'bg-red-50 text-red-700 border-red-200',
        dot: 'bg-red-600',
      };
    case 'Serious':
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-600',
      };
    case 'Stable':
      return {
        bg: 'bg-[#EAF2EE] text-[#176B60] border-[#C7DFD9]',
        dot: 'bg-[#176B60]',
      };
    case 'Recovering':
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-600',
      };
    case 'Routine Checkup':
    default:
      return {
        bg: 'bg-slate-100 text-[#253746] border-[#E2E8E5]',
        dot: 'bg-[#718096]',
      };
  }
}
