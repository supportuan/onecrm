'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Loader2 } from 'lucide-react';
import {
  getPerformanceReviews,
  getCounsellorConversionMetrics,
  generatePerformanceReviewsFromConversion,
  updatePerformanceReview,
} from '@/services/hrApi';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const currentMonthPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const currentWeekPeriod = () => {
  const d = new Date();
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const year = target.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
};

const monthPeriodOptions = () => {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const p = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    opts.push({ value: p, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` });
  }
  return opts;
};

const weekPeriodOptions = () => {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - day);
    const year = target.getUTCFullYear();
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const week = Math.ceil(((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
    const p = `${year}-W${String(week).padStart(2, '0')}`;
    opts.push({ value: p, label: `Week ${week}, ${year}` });
  }
  return Array.from(new Map(opts.map((o) => [o.value, o])).values());
};

const ratingLabel = (rate, target = 40) => {
  if (rate >= target * 1.2) return 'Exceeds';
  if (rate >= target) return 'Meets';
  if (rate >= target * 0.7) return 'Developing';
  return 'Below target';
};

export default function PerformanceReviews() {
  const [reviews, setReviews] = useState([]);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [periodType, setPeriodType] = useState('monthly');
  const [period, setPeriod] = useState(currentMonthPeriod());
  const [kpiTarget, setKpiTarget] = useState(40);

  const fetchReviews = useCallback(async (search = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPerformanceReviews(search || undefined);
      if (res.success) setReviews(res.data || []);
      else setError(res.message || 'Failed to load reviews');
    } catch {
      setError('Unable to load performance reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const res = await getCounsellorConversionMetrics(period);
      if (res.success) {
        setPreview(res.data || []);
        if (res.data?.[0]?.kpiTarget) setKpiTarget(res.data[0].kpiTarget);
      }
    } catch {
      setPreview([]);
    } finally {
      setPreviewLoading(false);
    }
  }, [period]);

  useEffect(() => {
    const timer = setTimeout(() => fetchReviews(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchReviews]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await generatePerformanceReviewsFromConversion({ period });
      if (res.success) {
        await fetchReviews(searchQuery);
        await fetchPreview();
      } else {
        setError(res.message || 'Failed to generate reviews');
      }
    } catch {
      setError('Failed to generate reviews from lead data');
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await updatePerformanceReview(id, { status });
      if (res.success) await fetchReviews(searchQuery);
    } catch {
      setError('Failed to update review status');
    }
  };

  const handlePeriodTypeChange = (type) => {
    setPeriodType(type);
    setPeriod(type === 'weekly' ? currentWeekPeriod() : currentMonthPeriod());
  };

  const periodOptions = periodType === 'weekly' ? weekPeriodOptions() : monthPeriodOptions();

  const avgConversion =
    reviews.filter((r) => r.conversionRate > 0).length > 0
      ? (
          reviews.reduce((s, r) => s + (r.conversionRate || 0), 0) /
          reviews.filter((r) => r.conversionRate > 0).length
        ).toFixed(1)
      : '—';

  const avgRating =
    reviews.filter((r) => r.rating > 0).length > 0
      ? (
          reviews.reduce((s, r) => s + r.rating, 0) / reviews.filter((r) => r.rating > 0).length
        ).toFixed(1)
      : '—';

  return (
    <div className="ui-container">
      {error && <div className="ui-error">{error}</div>}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 min-w-0">
          {[
            { label: 'Reviews', value: reviews.length },
            { label: 'Avg conversion', value: avgConversion === '—' ? '—' : `${avgConversion}%` },
            { label: 'Avg rating', value: avgRating === '—' ? '—' : `${avgRating} / 5` },
            { label: 'KPI target', value: `${kpiTarget}%` },
          ].map((stat) => (
            <div key={stat.label} className="ui-panel px-3 py-2.5">
              <p className="text-[10px] font-medium text-[var(--ui-text-muted)]">{stat.label}</p>
              <p className="text-base font-semibold text-brand mt-0.5 tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            value={periodType}
            onChange={(e) => handlePeriodTypeChange(e.target.value)}
            className="ui-field ui-select w-auto min-w-[110px] py-2 text-xs"
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="ui-field ui-select w-auto min-w-[130px] py-2 text-xs"
          >
            {periodOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="ui-btn-primary inline-flex items-center gap-2 py-2 text-xs"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Calculate reviews
          </button>
        </div>
      </div>

      {/* Live preview from CRM leads */}
      <div className="ui-panel overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--ui-border)] flex items-center justify-between">
          <h2 className="ui-text-h3">Conversion preview — {period}</h2>
          {previewLoading && <Loader2 className="h-4 w-4 animate-spin text-[var(--ui-text-muted)]" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--ui-border)] ui-text-caption normal-case tracking-normal">
                <th className="px-4 py-3 font-normal">Counsellor</th>
                <th className="px-4 py-3 font-normal">Leads</th>
                <th className="px-4 py-3 font-normal">Converted</th>
                <th className="px-4 py-3 font-normal">Enrolled</th>
                <th className="px-4 py-3 font-normal">Revenue</th>
                <th className="px-4 py-3 font-normal">Conversion %</th>
                <th className="px-4 py-3 font-normal">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ui-border)]">
              {preview.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center ui-text-meta">
                    {previewLoading ? 'Loading…' : 'No counsellor lead data for this period'}
                  </td>
                </tr>
              ) : (
                preview.map((row) => (
                  <tr key={row.counsellorId} className="hover:bg-[var(--ui-bg-page)]">
                    <td className="px-4 py-3 ui-text-strong">{row.counsellorName}</td>
                    <td className="px-4 py-3 ui-text-body">{row.leadsHandled}</td>
                    <td className="px-4 py-3 ui-text-body">{row.conversions}</td>
                    <td className="px-4 py-3 ui-text-body">{row.enrollments}</td>
                    <td className="px-4 py-3 ui-text-body">
                      ₹{(row.revenue || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="ui-text-strong">{row.conversionRate}%</span>
                      <span className="ui-text-meta ml-2">
                        ({ratingLabel(row.conversionRate, row.kpiTarget)})
                      </span>
                    </td>
                    <td className="px-4 py-3 ui-text-strong">{row.calculatedRating} / 5</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Saved reviews */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ui-text-muted)]" />
          <input
            type="text"
            placeholder="Search by name or ID…"
            className="ui-field pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="ui-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--ui-border)] ui-text-caption normal-case tracking-normal">
                  <th className="px-4 py-3 font-normal">Employee</th>
                  <th className="px-4 py-3 font-normal">Period</th>
                  <th className="px-4 py-3 font-normal">Leads → Converted</th>
                  <th className="px-4 py-3 font-normal">Revenue</th>
                  <th className="px-4 py-3 font-normal">Conversion %</th>
                  <th className="px-4 py-3 font-normal">Rating</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ui-border)]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center ui-text-meta">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center ui-text-meta">
                      No reviews yet. Select a period and click Calculate reviews.
                    </td>
                  </tr>
                ) : (
                  reviews.map((rev) => (
                    <tr key={rev.id} className="hover:bg-[var(--ui-bg-page)]">
                      <td className="px-4 py-3">
                        <p className="ui-text-strong">{rev.name}</p>
                        <p className="ui-text-meta">{rev.employeeId} · {rev.department}</p>
                      </td>
                      <td className="px-4 py-3 ui-text-body">{rev.reviewPeriod || rev.cycle}</td>
                      <td className="px-4 py-3 ui-text-body">
                        {rev.leadsHandled ?? '—'} → {rev.conversions ?? '—'}
                        {(rev.enrollments ?? 0) > 0 && (
                          <span className="ui-text-meta"> · {rev.enrollments} enrolled</span>
                        )}
                      </td>
                      <td className="px-4 py-3 ui-text-body">
                        {rev.revenue != null ? `₹${Number(rev.revenue).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3 ui-text-strong">
                        {rev.conversionRate != null ? `${rev.conversionRate}%` : '—'}
                      </td>
                      <td className="px-4 py-3 ui-text-strong">
                        {rev.rating > 0 ? `${rev.rating} / 5` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={rev.status}
                          onChange={(e) => handleStatusChange(rev.id, e.target.value)}
                          className="ui-field ui-select w-auto min-w-[130px] py-1.5 text-[12px]"
                        >
                          <option value="Self-Review">Self-Review</option>
                          <option value="Manager Review">Manager Review</option>
                          <option value="Calibrated">Calibrated</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
