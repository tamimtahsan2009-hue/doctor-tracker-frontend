export interface DateRangeResult {
  range: string;
  startDate: Date | null;
  endDate: Date;
  prevStartDate: Date | null;
  prevEndDate: Date | null;
  groupBy: 'daily' | 'weekly' | 'monthly';
  dateMatch: any;
  prevDateMatch: any;
}

export function parseDateRange(searchParams: URLSearchParams): DateRangeResult {
  const range = searchParams.get('range') || '30d';
  const customStart = searchParams.get('startDate');
  const customEnd = searchParams.get('endDate');
  const customGroupBy = searchParams.get('groupBy') as 'daily' | 'weekly' | 'monthly' | null;

  const now = new Date();
  const endDate = customEnd ? new Date(customEnd + 'T23:59:59.999Z') : new Date(now);

  let startDate: Date | null = null;
  let prevStartDate: Date | null = null;
  let prevEndDate: Date | null = null;
  let defaultGroupBy: 'daily' | 'weekly' | 'monthly' = 'daily';

  if (range === 'custom' && customStart) {
    startDate = new Date(customStart + 'T00:00:00.000Z');
    const spanMs = Math.max(1, endDate.getTime() - startDate.getTime());
    prevEndDate = new Date(startDate.getTime() - 1);
    prevStartDate = new Date(prevEndDate.getTime() - spanMs);

    const spanDays = spanMs / (1000 * 60 * 60 * 24);
    if (spanDays > 120) defaultGroupBy = 'monthly';
    else if (spanDays > 35) defaultGroupBy = 'weekly';
    else defaultGroupBy = 'daily';
  } else if (range === '7d') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    prevEndDate = new Date(startDate.getTime() - 1);
    prevStartDate = new Date(prevEndDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    defaultGroupBy = 'daily';
  } else if (range === '30d') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    prevEndDate = new Date(startDate.getTime() - 1);
    prevStartDate = new Date(prevEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    defaultGroupBy = 'daily';
  } else if (range === '90d') {
    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    prevEndDate = new Date(startDate.getTime() - 1);
    prevStartDate = new Date(prevEndDate.getTime() - 90 * 24 * 60 * 60 * 1000);
    defaultGroupBy = 'weekly';
  } else if (range === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const spanMs = endDate.getTime() - startDate.getTime();
    prevEndDate = new Date(startDate.getTime() - 1);
    prevStartDate = new Date(prevEndDate.getTime() - spanMs);
    defaultGroupBy = 'monthly';
  } else if (range === 'all') {
    startDate = null;
    prevStartDate = null;
    prevEndDate = null;
    defaultGroupBy = 'monthly';
  } else {
    // Default 30d
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    prevEndDate = new Date(startDate.getTime() - 1);
    prevStartDate = new Date(prevEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    defaultGroupBy = 'daily';
  }

  const groupBy = customGroupBy || defaultGroupBy;

  const dateMatch: any = {};
  if (startDate) {
    dateMatch.$gte = startDate;
  }
  dateMatch.$lte = endDate;

  const prevDateMatch: any = {};
  if (prevStartDate && prevEndDate) {
    prevDateMatch.$gte = prevStartDate;
    prevDateMatch.$lte = prevEndDate;
  }

  return {
    range,
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
    groupBy,
    dateMatch: startDate ? { admissionDate: dateMatch } : {},
    prevDateMatch: prevStartDate ? { admissionDate: prevDateMatch } : null,
  };
}

export function formatDateLabel(dateStr: string, groupBy: 'daily' | 'weekly' | 'monthly'): string {
  try {
    if (groupBy === 'monthly') {
      const [year, month] = dateStr.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    if (groupBy === 'weekly') {
      // dateStr e.g. "2026-W08"
      return dateStr;
    }
    // daily e.g. "2026-02-15"
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

