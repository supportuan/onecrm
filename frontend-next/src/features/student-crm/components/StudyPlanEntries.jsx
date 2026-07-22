'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';
import CatalogCourseFields from './CatalogCourseFields';
import { resolveCatalogCountryId } from '../catalogCountry';
import {
  createStudentStudyPlan,
  updateStudentStudyPlan,
  removeStudentStudyPlan,
} from '@/services/studentCrmApi';
import { getStageLabel, stageBadgeClass } from '../constants';

const INPUT =
  'w-full px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-800 focus:border-neutral-400 outline-none';

const toSelectId = (v) => (v == null || v === '' ? '' : String(v));

const planToCatalog = (plan) => ({
  countryId: toSelectId(resolveCatalogCountryId(plan.countryId ?? plan.countryRef?.id) || plan.countryId),
  country: plan.country || plan.countryRef?.name || '',
  universityId: toSelectId(plan.universityId ?? plan.universityRef?.id),
  university: plan.university || plan.universityRef?.name || '',
  courseId: toSelectId(plan.courseId ?? plan.courseRef?.id),
  course: plan.course || plan.courseRef?.name || '',
  intake: plan.intake || '',
});

const matchText = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

const appsForPlan = (plan, allApps = []) => {
  const linked = Array.isArray(plan.applications) ? plan.applications : [];
  const linkedIds = new Set(linked.map((a) => a.id));
  const orphans = allApps.filter(
    (app) =>
      !app.studyPlanId &&
      !linkedIds.has(app.id) &&
      matchText(app.country, plan.country) &&
      matchText(app.university, plan.university) &&
      matchText(app.course, plan.course)
  );
  return [...linked, ...orphans];
};

function StudyPlanCard({
  plan,
  index,
  countries,
  allApplications,
  studentId,
  disabled,
  canManage,
  selected,
  onSelect,
  onRefresh,
  onError,
}) {
  const [catalog, setCatalog] = useState(() => planToCatalog(plan));
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    setCatalog(planToCatalog(plan));
  }, [plan]);

  const persist = useCallback(
    async (nextCatalog) => {
      if (!plan.id || disabled) return;
      setSaving(true);
      try {
        await updateStudentStudyPlan(studentId, plan.id, {
          countryId: nextCatalog.countryId ? Number(nextCatalog.countryId) : null,
          country: nextCatalog.country || null,
          universityId: nextCatalog.universityId ? Number(nextCatalog.universityId) : null,
          university: nextCatalog.university || null,
          courseId: null,
          course: nextCatalog.course || null,
          intake: nextCatalog.intake || null,
        });
        await onRefresh?.();
      } catch (e) {
        onError?.(e?.message || 'Failed to save study option');
      } finally {
        setSaving(false);
      }
    },
    [plan.id, disabled, studentId, onRefresh, onError]
  );

  const scheduleSave = (nextCatalog) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(nextCatalog), 600);
  };

  const onCatalogChange = (patch) => {
    const next = { ...catalog, ...patch };
    setCatalog(next);
    scheduleSave(next);
  };

  const onIntakeChange = (intake) => {
    const next = { ...catalog, intake };
    setCatalog(next);
    scheduleSave(next);
  };

  const removePlan = async () => {
    if (!window.confirm('Remove this option from Explore?')) return;
    setRemoving(true);
    try {
      await removeStudentStudyPlan(studentId, plan.id);
      await onRefresh?.();
    } catch (e) {
      onError?.(e?.message || 'Failed to remove study option');
    } finally {
      setRemoving(false);
    }
  };

  const linkedApps = appsForPlan(plan, allApplications);

  return (
    <div
      className={`ui-panel overflow-hidden ${
        selected ? 'ring-1 ring-[var(--ui-brand)] border-[var(--ui-brand)]' : ''
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[var(--ui-border)] bg-neutral-50/80">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onSelect?.(plan)}
            className={`shrink-0 h-4 w-4 rounded-full border ${
              selected ? 'border-[var(--ui-brand)] bg-[var(--ui-brand)]' : 'border-neutral-300 bg-white'
            }`}
            title="Use for new application"
            aria-label={`Select explore option ${index + 1}`}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-800">Explore option {index + 1}</p>
            {selected && (
              <p className="text-[11px] text-brand">Prefills New application</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-neutral-500">Saving…</span>}
          {canManage && !disabled && (
            <button
              type="button"
              onClick={removePlan}
              disabled={removing}
              className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
            >
              <Trash2 size={14} />
              {removing ? 'Removing…' : 'Remove'}
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-start">
          <div className="lg:col-span-3">
            <CatalogCourseFields
              countries={countries}
              value={catalog}
              onChange={onCatalogChange}
              inputClass={INPUT}
              disabled={disabled || !canManage}
              layout="columns"
              compact
              countryLabel="Destination"
              universityLabel="University"
              courseLabel="Course *"
              courseFreeText
            />
          </div>
          <div>
            <label className="ui-label">Intake</label>
            <input
              className={INPUT}
              value={catalog.intake}
              disabled={disabled || !canManage}
              onChange={(e) => onIntakeChange(e.target.value)}
              placeholder="Fall 2026"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--ui-border)]">
        <div className="px-4 py-2.5 flex items-center justify-between gap-2 bg-neutral-50/60">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Applications ({linkedApps.length})
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                {['Code', 'Destination', 'University', 'Course', 'Intake', 'Stage', ''].map((h) => (
                  <th
                    key={h || 'action'}
                    className="px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-neutral-500 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {linkedApps.map((app) => (
                <tr key={app.id} className="hover:bg-neutral-50/80">
                  <td className="px-4 py-2.5 font-mono text-xs text-neutral-600 whitespace-nowrap">
                    {app.applicationCode}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-800">{app.country || '—'}</td>
                  <td className="px-4 py-2.5 text-neutral-800">{app.university || '—'}</td>
                  <td className="px-4 py-2.5 text-neutral-800">{app.course || '—'}</td>
                  <td className="px-4 py-2.5 text-neutral-600 whitespace-nowrap">{app.intake || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${stageBadgeClass(app.stage)}`}
                    >
                      {getStageLabel(app.stage)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <Link
                      href={`/student-crm/applications?student=${studentId}&app=${app.id}`}
                      className="text-xs font-medium text-neutral-700 hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {!linkedApps.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-5 text-center text-sm text-neutral-500">
                    No applications linked yet. Select this option, then use New application.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function StudyPlanEntries({
  studentId,
  plans = [],
  countries = [],
  allApplications = [],
  disabled = false,
  canManage = false,
  selectedPlanId = null,
  onSelectPlan,
  onRefresh,
  onError,
}) {
  const [adding, setAdding] = useState(false);

  const addPlan = async () => {
    setAdding(true);
    try {
      await createStudentStudyPlan(studentId, {});
      await onRefresh?.();
    } catch (e) {
      onError?.(e?.message || 'Failed to add study option');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="md:col-span-2 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-800">Explore options</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Add multiple destination, university, and course combinations. Course is free text
            (e.g. MBA). Select one to prefill New application.
          </p>
        </div>
        {canManage && !disabled && plans.length > 0 && (
          <button
            type="button"
            onClick={addPlan}
            disabled={adding}
            className="text-xs font-medium text-neutral-700 hover:text-brand inline-flex items-center gap-1"
          >
            <Plus size={14} />
            {adding ? 'Adding…' : 'Add explore option'}
          </button>
        )}
      </div>

      {!plans.length ? (
        <div className="ui-panel border-dashed p-8 text-center">
          <p className="text-sm text-neutral-500">No explore options added yet.</p>
          {canManage && !disabled && (
            <button
              type="button"
              onClick={addPlan}
              disabled={adding}
              className="ui-btn-primary text-xs mt-4 inline-flex items-center gap-1"
            >
              <Plus size={12} />
              {adding ? 'Adding…' : 'Add explore option'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan, index) => (
            <StudyPlanCard
              key={plan.id}
              plan={plan}
              index={index}
              countries={countries}
              allApplications={allApplications}
              studentId={studentId}
              disabled={disabled}
              canManage={canManage}
              selected={selectedPlanId === plan.id}
              onSelect={onSelectPlan}
              onRefresh={onRefresh}
              onError={onError}
            />
          ))}

          {canManage && !disabled && (
            <button
              type="button"
              onClick={addPlan}
              disabled={adding}
              className="w-full rounded-[var(--ui-radius)] border border-dashed border-neutral-300 bg-white py-3 text-sm font-medium text-neutral-600 hover:border-neutral-400 hover:text-neutral-800 inline-flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              {adding ? 'Adding explore option…' : 'Add explore option'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
