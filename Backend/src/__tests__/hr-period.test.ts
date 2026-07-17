import { describe, it, expect } from '@jest/globals';
import {
  detectPeriodType,
  formatReviewCycle,
  getIsoWeekPeriod,
  getMonthPeriod,
  parseReviewPeriod,
  isoWeekToDate,
  getPreviousIsoWeekPeriod,
  getPreviousMonthPeriod,
} from '../modules/hr/hr-period.js';

// ═══════════════════════════════════════════════════════════
// 1. detectPeriodType
// ═══════════════════════════════════════════════════════════
describe('detectPeriodType', () => {
  it('detects monthly format', () => {
    expect(detectPeriodType('2026-07')).toBe('monthly');
    expect(detectPeriodType('2026-01')).toBe('monthly');
    expect(detectPeriodType('2024-12')).toBe('monthly');
  });

  it('detects weekly format', () => {
    expect(detectPeriodType('2026-W27')).toBe('weekly');
    expect(detectPeriodType('2026-W01')).toBe('weekly');
    expect(detectPeriodType('2026-W53')).toBe('weekly');
  });

  it('detects lowercase weekly format as weekly', () => {
    expect(detectPeriodType('2026-w10')).toBe('weekly');
  });

  it('treats ambiguous strings as monthly', () => {
    // Non-week strings fall through to monthly
    expect(detectPeriodType('2026-07-15')).toBe('monthly');
  });
});

// ═══════════════════════════════════════════════════════════
// 2. isoWeekToDate
// ═══════════════════════════════════════════════════════════
describe('isoWeekToDate', () => {
  it('returns Monday for a known ISO week', () => {
    // ISO 2026-W01 starts on 2025-12-29 (Monday)
    const result = isoWeekToDate(2026, 1);
    expect(result.getUTCDay()).toBe(1); // Monday
  });

  it('returns a Monday for week 27 of 2026', () => {
    const result = isoWeekToDate(2026, 27);
    expect(result.getUTCDay()).toBe(1);
  });

  it('is always at midnight UTC', () => {
    const result = isoWeekToDate(2026, 10);
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════
// 3. parseReviewPeriod — monthly
// ═══════════════════════════════════════════════════════════
describe('parseReviewPeriod — monthly', () => {
  it('parses July 2026 correctly', () => {
    const { start, end, type } = parseReviewPeriod('2026-07');
    expect(type).toBe('monthly');
    expect(start.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(end.getUTCMonth()).toBe(6); // July (0-indexed)
    expect(end.getUTCDate()).toBe(31);
    expect(end.getUTCHours()).toBe(23);
    expect(end.getUTCMinutes()).toBe(59);
    expect(end.getUTCSeconds()).toBe(59);
  });

  it('handles February (28 days in non-leap year)', () => {
    const { start, end } = parseReviewPeriod('2026-02');
    expect(start.getUTCDate()).toBe(1);
    expect(end.getUTCDate()).toBe(28);
  });

  it('handles February in leap year (29 days)', () => {
    const { end } = parseReviewPeriod('2024-02');
    expect(end.getUTCDate()).toBe(29);
  });

  it('throws for invalid month (0)', () => {
    expect(() => parseReviewPeriod('2026-00')).toThrow();
  });

  it('throws for invalid month (13)', () => {
    expect(() => parseReviewPeriod('2026-13')).toThrow();
  });

  it('throws for malformed string', () => {
    expect(() => parseReviewPeriod('not-a-period')).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════
// 4. parseReviewPeriod — weekly
// ═══════════════════════════════════════════════════════════
describe('parseReviewPeriod — weekly', () => {
  it('start is always Monday and end is always Sunday', () => {
    const { start, end, type } = parseReviewPeriod('2026-W27');
    expect(type).toBe('weekly');
    expect(start.getUTCDay()).toBe(1); // Monday
    expect(end.getUTCDay()).toBe(0);   // Sunday
  });

  it('end is exactly 6 days after start at 23:59:59.999', () => {
    const { start, end } = parseReviewPeriod('2026-W10');
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(Math.floor(diffDays)).toBe(6);
    expect(end.getUTCHours()).toBe(23);
    expect(end.getUTCSeconds()).toBe(59);
    expect(end.getUTCMilliseconds()).toBe(999);
  });

  it('throws for week 0', () => {
    expect(() => parseReviewPeriod('2026-W00')).toThrow();
  });

  it('throws for week 54', () => {
    expect(() => parseReviewPeriod('2026-W54')).toThrow();
  });

  it('throws for malformed weekly string', () => {
    expect(() => parseReviewPeriod('2026-WABC')).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════
// 5. formatReviewCycle
// ═══════════════════════════════════════════════════════════
describe('formatReviewCycle', () => {
  it('formats monthly period as "Mon YYYY Review"', () => {
    expect(formatReviewCycle('2026-07')).toBe('Jul 2026 Review');
    expect(formatReviewCycle('2026-01')).toBe('Jan 2026 Review');
    expect(formatReviewCycle('2026-12')).toBe('Dec 2026 Review');
  });

  it('formats weekly period as "Week N, YYYY Review"', () => {
    expect(formatReviewCycle('2026-W27')).toBe('Week 27, 2026 Review');
    expect(formatReviewCycle('2026-W01')).toBe('Week 1, 2026 Review');
  });
});

// ═══════════════════════════════════════════════════════════
// 6. getMonthPeriod
// ═══════════════════════════════════════════════════════════
describe('getMonthPeriod', () => {
  it('returns YYYY-MM format for a given date', () => {
    expect(getMonthPeriod(new Date('2026-07-15'))).toBe('2026-07');
    expect(getMonthPeriod(new Date('2026-01-01'))).toBe('2026-01');
    expect(getMonthPeriod(new Date('2026-12-31'))).toBe('2026-12');
  });

  it('pads single-digit months with a leading zero', () => {
    const result = getMonthPeriod(new Date('2026-03-10'));
    expect(result).toBe('2026-03');
  });
});

// ═══════════════════════════════════════════════════════════
// 7. getIsoWeekPeriod
// ═══════════════════════════════════════════════════════════
describe('getIsoWeekPeriod', () => {
  it('returns YYYY-Www format', () => {
    const result = getIsoWeekPeriod(new Date('2026-07-07'));
    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('returns correct week for a known date', () => {
    // 2026-07-13 (Monday) is in W29
    const result = getIsoWeekPeriod(new Date('2026-07-13'));
    expect(result).toMatch(/^2026-W\d{2}$/);
  });

  it('uses current date when called with no argument', () => {
    const result = getIsoWeekPeriod();
    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });
});

// ═══════════════════════════════════════════════════════════
// 8. getPreviousIsoWeekPeriod
// ═══════════════════════════════════════════════════════════
describe('getPreviousIsoWeekPeriod', () => {
  it('returns an object with period and cycle string', () => {
    const { period, cycle } = getPreviousIsoWeekPeriod(new Date('2026-07-15'));
    expect(period).toMatch(/^\d{4}-W\d{2}$/);
    expect(cycle).toContain('Review');
  });

  it('period is exactly one week before the input date', () => {
    const refDate = new Date('2026-07-15');
    const prevDate = new Date(refDate);
    prevDate.setUTCDate(prevDate.getUTCDate() - 7);
    const expected = getIsoWeekPeriod(prevDate);
    const { period } = getPreviousIsoWeekPeriod(refDate);
    expect(period).toBe(expected);
  });
});

// ═══════════════════════════════════════════════════════════
// 9. getPreviousMonthPeriod
// ═══════════════════════════════════════════════════════════
describe('getPreviousMonthPeriod', () => {
  it('returns an object with period and cycle string', () => {
    const { period, cycle } = getPreviousMonthPeriod(new Date('2026-07-15'));
    expect(period).toMatch(/^\d{4}-\d{2}$/);
    expect(cycle).toContain('Review');
  });

  it('correctly goes to December of previous year from January', () => {
    const { period } = getPreviousMonthPeriod(new Date('2026-01-15'));
    expect(period).toBe('2025-12');
  });

  it('returns June when called with July date', () => {
    const { period } = getPreviousMonthPeriod(new Date('2026-07-01'));
    expect(period).toBe('2026-06');
  });
});
