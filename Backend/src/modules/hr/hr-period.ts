export type ReviewPeriodType = 'monthly' | 'weekly';

export const detectPeriodType = (period: string): ReviewPeriodType =>
  /-W\d{1,2}$/i.test(period) ? 'weekly' : 'monthly';

/** ISO week 1 Monday from calendar year + week number */
export const isoWeekToDate = (year: number, week: number): Date => {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);
  const result = new Date(week1Monday);
  result.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  result.setUTCHours(0, 0, 0, 0);
  return result;
};

export const parseReviewPeriod = (
  period: string
): { start: Date; end: Date; type: ReviewPeriodType } => {
  if (detectPeriodType(period) === 'weekly') {
    const match = period.match(/^(\d{4})-W(\d{1,2})$/i);
    if (!match) {
      throw new Error('Invalid week period. Use YYYY-Www (e.g. 2026-W27)');
    }
    const year = Number(match[1]);
    const week = Number(match[2]);
    if (!year || week < 1 || week > 53) {
      throw new Error('Invalid ISO week number');
    }
    const start = isoWeekToDate(year, week);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);
    return { start, end, type: 'weekly' };
  }

  const [year, month] = period.split('-').map(Number);
  if (!year || !month || month < 1 || month > 12) {
    throw new Error('Invalid period format. Use YYYY-MM or YYYY-Www');
  }
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end, type: 'monthly' };
};

export const formatReviewCycle = (period: string): string => {
  const { type } = parseReviewPeriod(period);
  if (type === 'weekly') {
    const match = period.match(/^(\d{4})-W(\d{1,2})$/i);
    if (!match) return `${period} Review`;
    return `Week ${Number(match[2])}, ${match[1]} Review`;
  }
  const [year, month] = period.split('-').map(Number);
  const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return `${label} Review`;
};

export const getIsoWeekPeriod = (date = new Date()): string => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const year = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
};

export const getMonthPeriod = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const getPreviousIsoWeekPeriod = (date = new Date()): { period: string; cycle: string } => {
  const prev = new Date(date);
  prev.setUTCDate(prev.getUTCDate() - 7);
  const period = getIsoWeekPeriod(prev);
  return { period, cycle: formatReviewCycle(period) };
};

export const getPreviousMonthPeriod = (date = new Date()): { period: string; cycle: string } => {
  const prev = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const period = getMonthPeriod(prev);
  return { period, cycle: formatReviewCycle(period) };
};
