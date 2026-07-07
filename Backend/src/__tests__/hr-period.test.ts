import { describe, it, expect } from '@jest/globals';
import {
  detectPeriodType,
  formatReviewCycle,
  getIsoWeekPeriod,
  getMonthPeriod,
  parseReviewPeriod,
} from '../modules/hr/hr-period.js';

describe('hr-period', () => {
  it('detects monthly and weekly period formats', () => {
    expect(detectPeriodType('2026-07')).toBe('monthly');
    expect(detectPeriodType('2026-W27')).toBe('weekly');
  });

  it('parses monthly period boundaries', () => {
    const { start, end, type } = parseReviewPeriod('2026-07');
    expect(type).toBe('monthly');
    expect(start.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(end.getUTCMonth()).toBe(6);
    expect(end.getUTCDate()).toBe(31);
  });

  it('parses weekly period boundaries', () => {
    const { start, end, type } = parseReviewPeriod('2026-W27');
    expect(type).toBe('weekly');
    expect(start.getUTCDay()).toBe(1);
    expect(end.getUTCDay()).toBe(0);
    expect(end.getTime()).toBeGreaterThan(start.getTime());
  });

  it('formats review cycle labels', () => {
    expect(formatReviewCycle('2026-07')).toBe('Jul 2026 Review');
    expect(formatReviewCycle('2026-W27')).toBe('Week 27, 2026 Review');
  });

  it('builds current period helpers', () => {
    expect(getMonthPeriod(new Date('2026-07-15'))).toBe('2026-07');
    expect(getIsoWeekPeriod(new Date('2026-07-07'))).toMatch(/^\d{4}-W\d{2}$/);
  });
});
