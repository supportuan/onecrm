'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bookmark, BookmarkCheck, GitCompare, Search, X } from 'lucide-react';
import { listCatalog } from '@/services/crmSettingsApi';
import { createStudentStudyPlan, removeStudentStudyPlan } from '@/services/studentCrmApi';
import { resolveStudyCascades } from '../studyFormOptions';
import { getStageLabel, stageBadgeClass } from '../constants';

const INPUT =
  'w-full px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-800 focus:border-neutral-400 outline-none';
const SELECT =
  "w-full px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-800 focus:border-neutral-400 outline-none appearance-none cursor-pointer bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10";
const SELECT_BG = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
};

const NAV = [
  { id: 'preferences', label: 'Preferences' },
  { id: 'explore', label: 'Explore' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'compare', label: 'Compare' },
  { id: 'applications', label: 'Applications' },
];

const TRACK_STAGES = [
  'DRAFT',
  'DOCUMENTS_PENDING',
  'SUBMITTED',
  'OFFER_RECEIVED',
  'VISA_PROCESS',
  'ENROLLED',
];

function Field({ label, children, optional }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-neutral-600">
        {label}
        {optional ? <span className="font-normal text-neutral-400"> (optional)</span> : null}
      </label>
      {children}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50/70 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-0.5 text-sm text-neutral-800">{value}</p>
    </div>
  );
}

function programKey(p) {
  return `${p.universityId || ''}:${p.courseId || p.courseName || ''}`;
}

function planMatchesProgram(plan, program) {
  if (program.courseId && plan.courseId && Number(plan.courseId) === Number(program.courseId)) {
    return true;
  }
  const sameUni =
    (plan.universityId &&
      program.universityId &&
      Number(plan.universityId) === Number(program.universityId)) ||
    String(plan.university || '').toLowerCase() === String(program.universityName || '').toLowerCase();
  const sameCourse =
    String(plan.course || '').toLowerCase() === String(program.courseName || '').toLowerCase();
  return sameUni && sameCourse;
}

/**
 * Counsellor decision flow: Preferences → Explore → Details → Shortlist → Compare → Applications.
 */
export default function StudyExploreFlow({
  studentId,
  profile,
  form,
  setForm,
  formOptions,
  canManage,
  disabled,
  onSavePreferences,
  onRefresh,
  onCreateApplication,
  onError,
  onFlash,
}) {
  const [step, setStep] = useState('preferences');
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCountryId, setFilterCountryId] = useState('');
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [detail, setDetail] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [busyKey, setBusyKey] = useState('');

  const plans = useMemo(() => profile?.studyPlans || [], [profile?.studyPlans]);
  const applications = profile?.applications || [];
  const countries = formOptions?.countries || [];
  const { subIndustries: programLevels } = resolveStudyCascades(
    formOptions?.industries,
    form?.industryId,
    form?.subIndustryId
  );

  const preferredCountryIds = useMemo(() => {
    if (Array.isArray(form?.preferredCountryIds) && form.preferredCountryIds.length) {
      return form.preferredCountryIds.map(String);
    }
    if (form?.countryId) return [String(form.countryId)];
    return [];
  }, [form]);

  useEffect(() => {
    if (step !== 'explore') return undefined;
    let cancelled = false;
    const load = async () => {
      setLoadingPrograms(true);
      try {
        const countryId = filterCountryId || preferredCountryIds[0] || '';
        const res = await listCatalog({
          countryId: countryId ? Number(countryId) : undefined,
          page: 1,
          limit: 60,
          search: search.trim() || undefined,
        });
        if (!cancelled) setPrograms(res?.data?.items || res?.items || []);
      } catch (e) {
        if (!cancelled) {
          setPrograms([]);
          onError?.(e?.message || 'Failed to load programs');
        }
      } finally {
        if (!cancelled) setLoadingPrograms(false);
      }
    };
    const t = setTimeout(load, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [step, search, filterCountryId, preferredCountryIds, onError]);

  const isShortlisted = useCallback(
    (program) => plans.some((plan) => planMatchesProgram(plan, program)),
    [plans]
  );

  const shortlistProgram = async (program) => {
    if (!canManage || disabled) return;
    if (isShortlisted(program)) {
      setStep('shortlisted');
      return;
    }
    const key = programKey(program);
    setBusyKey(key);
    try {
      const intakeValue = Array.isArray(program.intakes)
        ? program.intakes[0]
        : typeof program.intakes === 'string'
          ? program.intakes
          : program.intakes ||
            [form?.intakeMonth, form?.intakeYear].filter(Boolean).join(' ') ||
            null;
      await createStudentStudyPlan(studentId, {
        countryId: program.countryId || null,
        country: program.countryName || null,
        universityId: program.universityId || null,
        university: program.universityName || null,
        courseId: program.courseId || null,
        course: program.courseName || null,
        intake: intakeValue,
        notes: 'Shortlisted from Explore',
      });
      await onRefresh?.();
      onFlash?.('Added to shortlist');
    } catch (e) {
      onError?.(e?.message || 'Failed to shortlist');
    } finally {
      setBusyKey('');
    }
  };

  const removeShortlist = async (planId) => {
    if (!canManage || disabled) return;
    if (!window.confirm('Remove this program from the shortlist?')) return;
    setBusyKey(`plan-${planId}`);
    try {
      await removeStudentStudyPlan(studentId, planId);
      setCompareIds((ids) => ids.filter((id) => id !== planId));
      await onRefresh?.();
    } catch (e) {
      onError?.(e?.message || 'Failed to remove');
    } finally {
      setBusyKey('');
    }
  };

  const continuePreferences = async () => {
    setSavingPrefs(true);
    try {
      const ok = await onSavePreferences?.();
      if (ok === false) return;
      setStep('explore');
    } catch (e) {
      onError?.(e?.message || 'Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const toggleCompare = (planId) => {
    setCompareIds((ids) => {
      if (ids.includes(planId)) return ids.filter((id) => id !== planId);
      if (ids.length >= 3) return ids;
      return [...ids, planId];
    });
  };

  const comparePlans = plans.filter((p) => compareIds.includes(p.id));

  const setPreferredCountries = (ids) => {
    const next = ids.map(String);
    const primary = next[0] || '';
    const country = countries.find((c) => String(c.id) === primary);
    setForm((prev) => ({
      ...prev,
      preferredCountryIds: next,
      countryId: primary,
      preferredCountry: country?.name || prev.preferredCountry || '',
    }));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3">
        <p className="text-sm font-semibold text-blue-950">Explore</p>
        <p className="mt-1 text-xs leading-relaxed text-blue-800">
          Decision-based counselling flow: define goals, explore programs, shortlist, compare, then
          create and track applications.
        </p>
      </div>

      <nav className="flex flex-wrap gap-1 rounded-xl border border-neutral-200 bg-white p-1">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStep(item.id)}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              step === item.id || (step === 'details' && item.id === 'explore')
                ? 'bg-brand text-white'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {item.label}
            {item.id === 'shortlisted' && plans.length ? (
              <span className="ml-1 opacity-80">({plans.length})</span>
            ) : null}
          </button>
        ))}
      </nav>

      {step === 'preferences' && (
        <div className="ui-panel space-y-5 p-6">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Study Preferences</h3>
            <p className="mt-1 text-xs text-neutral-500">Define what the student is looking for.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Study Level">
              <select
                className={SELECT}
                style={SELECT_BG}
                value={form.level}
                disabled={!canManage || disabled}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
              >
                <option value="">Select</option>
                {['UG', 'PG', 'PhD', 'Diploma'].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Field of Study">
              <select
                className={SELECT}
                style={SELECT_BG}
                value={form.industryId}
                disabled={!canManage || disabled}
                onChange={(e) =>
                  setForm({
                    ...form,
                    industryId: e.target.value,
                    subIndustryId: '',
                    studyAreaId: '',
                  })
                }
              >
                <option value="">Select field of study</option>
                {(formOptions.industries || []).map((i) => (
                  <option key={i.id} value={String(i.id)}>
                    {i.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Program Level">
              <select
                className={SELECT}
                style={SELECT_BG}
                value={form.subIndustryId}
                disabled={!canManage || disabled || !form.industryId}
                onChange={(e) => setForm({ ...form, subIndustryId: e.target.value })}
              >
                <option value="">
                  {form.industryId ? 'Select program level' : 'Select field of study first'}
                </option>
                {programLevels.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Preferred Countries">
              <select
                multiple
                className={`${INPUT} min-h-[108px]`}
                value={preferredCountryIds}
                disabled={!canManage || disabled}
                onChange={(e) =>
                  setPreferredCountries(Array.from(e.target.selectedOptions).map((o) => o.value))
                }
              >
                {countries.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-neutral-400">Hold Ctrl/Cmd to select multiple.</p>
            </Field>
            <Field label="Intake">
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={INPUT}
                  placeholder="Month"
                  value={form.intakeMonth}
                  disabled={!canManage || disabled}
                  onChange={(e) => setForm({ ...form, intakeMonth: e.target.value })}
                />
                <input
                  className={INPUT}
                  placeholder="Year"
                  value={form.intakeYear}
                  disabled={!canManage || disabled}
                  onChange={(e) => setForm({ ...form, intakeYear: e.target.value })}
                />
              </div>
            </Field>
            <Field label="Budget" optional>
              <input
                className={INPUT}
                value={form.studyBudget}
                disabled={!canManage || disabled}
                onChange={(e) => setForm({ ...form, studyBudget: e.target.value })}
                placeholder="e.g. £20,000 / year"
              />
            </Field>
            <Field label="English Test" optional>
              <input
                className={INPUT}
                value={form.ieltsScore || ''}
                disabled={!canManage || disabled}
                onChange={(e) => setForm({ ...form, ieltsScore: e.target.value })}
                placeholder="IELTS / TOEFL score"
              />
            </Field>
          </div>
          {canManage && !disabled && (
            <div className="flex justify-end border-t border-neutral-100 pt-4">
              <button
                type="button"
                onClick={continuePreferences}
                disabled={savingPrefs}
                className="ui-btn-primary"
              >
                {savingPrefs ? 'Saving…' : 'Continue to Explore'}
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'explore' && (
        <div className="space-y-4">
          <div className="ui-panel space-y-3 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                className={`${INPUT} pl-9`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search university or course"
              />
            </div>
            <select
              className={`${SELECT} max-w-xs`}
              style={SELECT_BG}
              value={filterCountryId}
              onChange={(e) => setFilterCountryId(e.target.value)}
            >
              <option value="">All preferred / any country</option>
              {countries.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {loadingPrograms ? (
            <div className="ui-panel p-8 text-center text-sm text-neutral-500">Loading programs…</div>
          ) : !programs.length ? (
            <div className="ui-panel border-dashed p-8 text-center text-sm text-neutral-500">
              No programs found. Adjust search or country filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {programs.map((program) => {
                const shortlisted = isShortlisted(program);
                const key = programKey(program);
                return (
                  <div key={key} className="ui-panel flex flex-col gap-3 p-4">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{program.universityName}</p>
                      <p className="mt-0.5 text-sm text-brand">{program.courseName}</p>
                      <p className="mt-2 text-xs text-neutral-500">
                        {[program.countryName, program.universityCity].filter(Boolean).join(' · ')}
                        {program.level ? ` · ${program.level}` : ''}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Intake:{' '}
                        {Array.isArray(program.intakes)
                          ? program.intakes.join(', ')
                          : program.intakes || '—'}
                      </p>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDetail(program);
                          setStep('details');
                        }}
                        className="ui-btn-secondary text-xs"
                      >
                        View Details
                      </button>
                      {canManage && !disabled && (
                        <button
                          type="button"
                          disabled={busyKey === key}
                          onClick={() => shortlistProgram(program)}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold ${
                            shortlisted
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                              : 'bg-brand text-white'
                          }`}
                        >
                          {shortlisted ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                          {shortlisted ? 'Shortlisted' : busyKey === key ? 'Saving…' : 'Shortlist'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === 'details' && detail && (
        <div className="ui-panel space-y-5 p-6">
          <button
            type="button"
            onClick={() => setStep('explore')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-brand"
          >
            <ArrowLeft size={14} /> Back to Explore
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Program Details
            </p>
            <h3 className="mt-1 text-lg font-semibold text-neutral-900">{detail.courseName}</h3>
            <p className="text-sm text-neutral-600">{detail.universityName}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <DetailRow label="University" value={detail.universityName} />
            <DetailRow label="Course" value={detail.courseName} />
            <DetailRow label="Campus" value={detail.universityCity || '—'} />
            <DetailRow
              label="Intake"
              value={
                Array.isArray(detail.intakes) ? detail.intakes.join(', ') : detail.intakes || '—'
              }
            />
            <DetailRow label="Duration" value={detail.duration || '—'} />
            <DetailRow label="Level" value={detail.level || '—'} />
            <DetailRow label="Fees" value={detail.tuitionFee || '—'} />
            <DetailRow label="Application fee" value={detail.applicationFee || '—'} />
            <DetailRow label="IELTS" value={detail.ielts || '—'} />
            <DetailRow label="TOEFL" value={detail.toefl || '—'} />
            <DetailRow label="Scholarships" value="Check university page / counsellor notes" />
            <DetailRow label="Documents required" value="Passport, academics, English test, SOP" />
          </div>
          <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
            {canManage && !disabled && (
              <>
                <button
                  type="button"
                  disabled={busyKey === programKey(detail)}
                  onClick={() => shortlistProgram(detail)}
                  className="ui-btn-primary text-xs"
                >
                  Shortlist
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await shortlistProgram(detail);
                    onCreateApplication?.({
                      country: detail.countryName,
                      countryId: detail.countryId,
                      university: detail.universityName,
                      universityId: detail.universityId,
                      course: detail.courseName,
                      intake: Array.isArray(detail.intakes) ? detail.intakes[0] : detail.intakes,
                    });
                  }}
                  className="ui-btn-secondary text-xs"
                >
                  Create Application
                </button>
              </>
            )}
            <button type="button" onClick={() => setStep('explore')} className="ui-btn-secondary text-xs">
              Back to Explore
            </button>
          </div>
        </div>
      )}

      {step === 'shortlisted' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Shortlisted Programs</h3>
              <p className="mt-0.5 text-xs text-neutral-500">
                Save options while discussing with the student. Select up to 3 to compare.
              </p>
            </div>
            <button
              type="button"
              disabled={compareIds.length < 2}
              onClick={() => setStep('compare')}
              className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              <GitCompare size={14} />
              Compare ({compareIds.length})
            </button>
          </div>

          {!plans.length ? (
            <div className="ui-panel border-dashed p-8 text-center text-sm text-neutral-500">
              No shortlisted programs yet.
              <div className="mt-3">
                <button type="button" onClick={() => setStep('explore')} className="ui-btn-primary text-xs">
                  Go to Explore
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((plan, index) => (
                <div key={plan.id} className="ui-panel p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={compareIds.includes(plan.id)}
                        onChange={() => toggleCompare(plan.id)}
                      />
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">
                          Program {String.fromCharCode(65 + index)} · {plan.course || 'Course TBD'}
                        </p>
                        <p className="text-xs text-neutral-600">{plan.university || '—'}</p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {[plan.country, plan.intake].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {canManage && !disabled && (
                        <>
                          <button
                            type="button"
                            onClick={() => onCreateApplication?.(plan)}
                            className="ui-btn-primary text-xs"
                          >
                            Create Application
                          </button>
                          <button
                            type="button"
                            disabled={busyKey === `plan-${plan.id}`}
                            onClick={() => removeShortlist(plan.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            <X size={14} /> Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'compare' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Compare Programs</h3>
              <p className="mt-0.5 text-xs text-neutral-500">Evaluate shortlisted options side by side.</p>
            </div>
            <button type="button" onClick={() => setStep('shortlisted')} className="ui-btn-secondary text-xs">
              Back
            </button>
          </div>

          {comparePlans.length < 2 ? (
            <div className="ui-panel border-dashed p-8 text-center text-sm text-neutral-500">
              Select at least 2 shortlisted programs to compare.
            </div>
          ) : (
            <div className="ui-panel overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/80">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Attribute
                    </th>
                    {comparePlans.map((plan, i) => (
                      <th key={plan.id} className="px-4 py-3 text-xs font-semibold text-neutral-800">
                        {String.fromCharCode(65 + i)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {[
                    ['University', (p) => p.university],
                    ['Course', (p) => p.course],
                    ['Fees', () => '—'],
                    ['Duration', () => '—'],
                    ['Intake', (p) => p.intake],
                    ['Requirements', () => '—'],
                    ['Scholarship', () => '—'],
                  ].map(([label, getter]) => (
                    <tr key={label}>
                      <td className="px-4 py-3 text-xs font-semibold text-neutral-500">{label}</td>
                      {comparePlans.map((plan) => (
                        <td key={plan.id} className="px-4 py-3 text-neutral-800">
                          {getter(plan) || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="px-4 py-3 text-xs font-semibold text-neutral-500">Select</td>
                    {comparePlans.map((plan) => (
                      <td key={plan.id} className="px-4 py-3">
                        {canManage && !disabled && (
                          <button
                            type="button"
                            onClick={() => onCreateApplication?.(plan)}
                            className="ui-btn-primary text-xs"
                          >
                            Select Program
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {step === 'applications' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Application Tracking</h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Follow progress after submission across counselling milestones.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {TRACK_STAGES.map((key) => {
              const count = applications.filter((a) => {
                if (key === 'SUBMITTED') return ['SUBMITTED', 'UNDER_REVIEW'].includes(a.stage);
                if (key === 'OFFER_RECEIVED') {
                  return ['OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_REJECTED'].includes(a.stage);
                }
                return a.stage === key;
              }).length;
              return (
                <div
                  key={key}
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-center"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                    {getStageLabel(key)}
                  </p>
                  <p className="text-lg font-semibold text-brand">{count}</p>
                </div>
              );
            })}
          </div>

          <div className="ui-panel overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/80 text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">University</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {!applications.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                      No applications yet.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id}>
                      <td className="px-4 py-3 font-medium text-neutral-800">
                        {app.applicationCode || `APP-${app.id}`}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{app.university || '—'}</td>
                      <td className="px-4 py-3 text-neutral-700">{app.course || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${stageBadgeClass(app.stage)}`}
                        >
                          {getStageLabel(app.stage)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/student-crm/applications/${app.id}`}
                          className="text-xs font-semibold text-brand"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
