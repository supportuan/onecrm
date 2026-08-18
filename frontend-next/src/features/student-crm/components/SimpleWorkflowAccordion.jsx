'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, CircleDot, FileText, GraduationCap, ShieldCheck, UserRound } from 'lucide-react';
import {
  ApplicationMetaEditor,
  AuditTimeline,
} from './ApplicationParts';
import StaffApplicationFees from './StaffApplicationFees';
import DiscussionThread from './DiscussionThread';
import GatheringChecklist from './GatheringChecklist';
import StudentInfoPanel from './StudentInfoPanel';
import UniversityApplicationPanel from './UniversityApplicationPanel';
import { fetchAllUniversitiesForCountry, listCountries } from '@/services/crmSettingsApi';
import { listWorkflowTemplates } from '@/services/studentCrmApi';
import { displayStageLabel, getWorkflowIcon, isWorkflowStageComplete, resolveCountryProfile, sortWorkflowStages, stageAppliesToCountry } from '../workflowTemplateUi';
import { formatDisplayDate, formatStamp, toDateInputValue } from '../dateFormat';

const EMPTY_LIST = [];

const isUniversityField = (field) =>
  ['TEXT', 'SELECT'].includes(field?.fieldType) && /university/i.test(field?.fieldKey || field?.label || '');

/** University catalog dropdown with a manual-entry escape hatch. */
function UniversityPicker({ value, options, disabled, className, placeholder, onChange }) {
  const [manual, setManual] = useState(false);

  if (!options.length || manual) {
    return (
      <div className="space-y-1">
        <input
          type="text"
          className={className}
          value={value}
          disabled={disabled}
          placeholder={placeholder || 'University name'}
          onChange={(e) => onChange(e.target.value)}
        />
        {options.length ? (
          <button type="button" className="text-[11px] text-brand hover:underline" onClick={() => setManual(false)}>
            Choose from list
          </button>
        ) : null}
      </div>
    );
  }

  const inList = Boolean(value) && options.includes(value);
  return (
    <select
      className={className}
      value={inList ? value : value ? '__current__' : ''}
      disabled={disabled}
      onChange={(e) => {
        const next = e.target.value;
        if (next === '__manual__') {
          setManual(true);
          return;
        }
        if (next === '__current__') return;
        onChange(next);
      }}
    >
      <option value="">Select university</option>
      {value && !inList ? <option value="__current__">{value}</option> : null}
      {options.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
      <option value="__manual__">Other — type manually…</option>
    </select>
  );
}

function GenericWorkflowSection({
  app,
  stage,
  canManage,
  onSaveProgress,
  onSaved,
  variant = 'default',
  universityOptions = [],
}) {
  const isDetail = variant === 'detail';
  const inputClass = isDetail
    ? 'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-brand focus:outline-none'
    : 'ui-field';
  const labelClass = isDetail ? 'text-[11px] font-medium uppercase tracking-wide text-neutral-500' : 'ui-text-caption';
  const panelClass = isDetail ? 'rounded-2xl border border-neutral-200 bg-white p-4 space-y-3' : '';
  const checklistItemClass = isDetail
    ? 'rounded-xl border border-neutral-200 bg-white px-3 py-3 space-y-2'
    : 'rounded-xl border border-neutral-200 px-3 py-3 space-y-2';

  const valueMap = useMemo(
    () => Object.fromEntries((app.workflowFieldValues || []).map((item) => [item.fieldTemplateId, item.valueJson])),
    [app.workflowFieldValues]
  );
  const checklistMap = useMemo(
    () => Object.fromEntries((app.workflowChecklistValues || []).map((item) => [item.checklistTemplateId, item])),
    [app.workflowChecklistValues]
  );

  const [fieldValues, setFieldValues] = useState({});
  const [checklistValues, setChecklistValues] = useState({});

  useEffect(() => {
    const nextFields = {};
    const nextChecklist = {};
    (stage.fields || []).forEach((field) => {
      const raw = valueMap[field.id];
      nextFields[field.id] = field.fieldType === 'DATE' ? toDateInputValue(raw) : raw ?? '';
    });
    (stage.checklists || []).forEach((item) => {
      const current = checklistMap[item.id];
      nextChecklist[item.id] = {
        completed: Boolean(current?.completed),
        valueText: current?.valueText || '',
      };
    });
    setFieldValues(nextFields);
    setChecklistValues(nextChecklist);
  }, [stage?.id, valueMap, checklistMap]);

  const renderInput = (field) => {
    const value = fieldValues[field.id] ?? '';
    const common = {
      className: inputClass,
      value,
      disabled: !canManage,
      onChange: (e) => setFieldValues((prev) => ({ ...prev, [field.id]: e.target.value })),
      placeholder: field.placeholder || '',
    };
    if (isUniversityField(field)) {
      return (
        <UniversityPicker
          value={value}
          options={universityOptions}
          disabled={!canManage}
          className={inputClass}
          placeholder={field.placeholder}
          onChange={(next) => setFieldValues((prev) => ({ ...prev, [field.id]: next }))}
        />
      );
    }
    if (field.fieldType === 'TEXTAREA') return <textarea rows={3} {...common} />;
    if (field.fieldType === 'DATE') {
      return (
        <input
          type="date"
          {...common}
          value={toDateInputValue(value)}
          onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
        />
      );
    }
    if (field.fieldType === 'NUMBER' || field.fieldType === 'CURRENCY') return <input type="number" {...common} />;
    if (field.fieldType === 'URL') return <input type="url" {...common} />;
    if (field.fieldType === 'CHECKBOX') {
      return (
        <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={Boolean(value)}
            disabled={!canManage}
            onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.id]: e.target.checked }))}
          />
          {field.label}
        </label>
      );
    }
    if (field.fieldType === 'SELECT') {
      const options = Array.isArray(field.optionsJson) ? field.optionsJson : [];
      return (
        <select
          className={inputClass}
          value={value}
          disabled={!canManage}
          onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
        >
          <option value="">Select</option>
          {options.map((option) => {
            const optionValue = String(option?.value ?? option);
            const optionLabel = String(option?.label ?? option);
            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>
      );
    }
    return <input type="text" {...common} />;
  };

  const save = async () => {
    if (!onSaveProgress) return;
    await onSaveProgress({
      fieldValues: Object.entries(fieldValues).map(([fieldTemplateId, valueJson]) => ({
        fieldTemplateId: Number(fieldTemplateId),
        valueJson,
      })),
      checklistValues: Object.entries(checklistValues).map(([checklistTemplateId, value]) => ({
        checklistTemplateId: Number(checklistTemplateId),
        completed: Boolean(value?.completed),
        valueText: value?.valueText || null,
      })),
    });
    onSaved?.();
  };

  const checklistItems = stage.checklists || [];
  const collectedCount = checklistItems.filter((item) => checklistValues[item.id]?.completed).length;
  const checklistTitle = stage.metadata?.checklistTitle || 'Checklist';
  const fieldHint = stage.metadata?.hint || '';

  const updateButton = canManage && onSaveProgress && (
    <button
      type="button"
      onClick={save}
      className={
        isDetail
          ? 'shrink-0 rounded-lg bg-brand px-5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-brand-hover'
          : 'ui-btn-primary'
      }
    >
      Update
    </button>
  );

  if (!isDetail) {
    return (
      <div className="space-y-4">
        {!!stage.fields?.length && (
          <div className="grid md:grid-cols-2 gap-3">
            {stage.fields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                {field.fieldType !== 'CHECKBOX' && <label className={labelClass}>{field.label}</label>}
                {renderInput(field)}
              </div>
            ))}
          </div>
        )}

        {!!checklistItems.length && (
          <div className="space-y-2">
            {checklistItems.map((item) => (
              <div key={item.id} className={checklistItemClass}>
                <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={Boolean(checklistValues[item.id]?.completed)}
                    disabled={!canManage}
                    onChange={(e) =>
                      setChecklistValues((prev) => ({
                        ...prev,
                        [item.id]: { ...(prev[item.id] || {}), completed: e.target.checked },
                      }))
                    }
                  />
                  {item.label}
                </label>
                <input
                  className={inputClass}
                  placeholder="Notes / link"
                  value={checklistValues[item.id]?.valueText || ''}
                  disabled={!canManage}
                  onChange={(e) =>
                    setChecklistValues((prev) => ({
                      ...prev,
                      [item.id]: { ...(prev[item.id] || {}), valueText: e.target.value },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        )}

        {canManage && onSaveProgress && (stage.fields?.length || checklistItems.length) ? (
          <div className="flex justify-end">
            <button type="button" className="ui-btn-primary" onClick={save}>
              Save step
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!!checklistItems.length && (
        <div className={panelClass}>
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-sm font-semibold text-brand">{checklistTitle}</h4>
            {updateButton}
          </div>
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {checklistItems.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-neutral-300 accent-brand"
                  checked={Boolean(checklistValues[item.id]?.completed)}
                  disabled={!canManage}
                  onChange={(e) =>
                    setChecklistValues((prev) => ({
                      ...prev,
                      [item.id]: { ...(prev[item.id] || {}), completed: e.target.checked },
                    }))
                  }
                />
                <span className="truncate">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {!!stage.fields?.length && (
        <div className={panelClass}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-brand">Details</h4>
              {fieldHint ? <p className="mt-0.5 text-xs text-neutral-500">{fieldHint}</p> : null}
            </div>
            {!checklistItems.length ? updateButton : null}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {stage.fields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                {field.fieldType !== 'CHECKBOX' && <label className={labelClass}>{field.label}</label>}
                {renderInput(field)}
                {field.helpText ? <p className="text-[11px] text-neutral-500">{field.helpText}</p> : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {!!checklistItems.length && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="grid grid-cols-2 gap-3 border-b border-neutral-100 bg-neutral-50/60 px-4 py-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">Stage Started Date</p>
              <p className="mt-1 text-sm font-medium text-brand">
                {app?.createdAt ? formatDisplayDate(app.createdAt) : '--'}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">Document collected</p>
              <p className="mt-1 text-sm font-medium text-brand">
                {collectedCount}/{checklistItems.length}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-[11px] uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-2 font-medium">S.No.</th>
                  <th className="px-4 py-2 font-medium">Document Name</th>
                  <th className="px-4 py-2 font-medium">Reference</th>
                  <th className="px-4 py-2 font-medium">Date Uploaded</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {checklistItems.map((item, index) => {
                  const saved = checklistMap[item.id];
                  const done = Boolean(checklistValues[item.id]?.completed);
                  return (
                    <tr key={item.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-4 py-2.5 text-neutral-500">{index + 1}.</td>
                      <td className="px-4 py-2.5 text-brand">{item.label}</td>
                      <td className="px-4 py-2.5">
                        <input
                          className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-800 placeholder:text-neutral-400 focus:border-brand focus:outline-none"
                          placeholder="Enter link / note"
                          value={checklistValues[item.id]?.valueText || ''}
                          disabled={!canManage}
                          onChange={(e) =>
                            setChecklistValues((prev) => ({
                              ...prev,
                              [item.id]: { ...(prev[item.id] || {}), valueText: e.target.value },
                            }))
                          }
                        />
                      </td>
                      <td className="px-4 py-2.5 text-neutral-500">{done ? formatStamp(saved?.updatedAt) : '--'}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                            done
                              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                              : 'border-amber-100 bg-amber-50 text-amber-700'
                          }`}
                        >
                          {done ? 'Collected' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!checklistItems.length && !stage.fields?.length ? (
        <p className="text-sm text-neutral-500">No fields configured for this step yet.</p>
      ) : null}
    </div>
  );
}

function DestinationTemplateSwitcher({ app, canManage, countries = EMPTY_LIST, onUpdateMeta }) {
  const [countryList, setCountryList] = useState(countries);
  const [templates, setTemplates] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (countries.length) {
      setCountryList(countries);
      return undefined;
    }
    let cancelled = false;
    listCountries()
      .then((res) => {
        if (!cancelled) setCountryList(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setCountryList([]);
      });
    return () => {
      cancelled = true;
    };
  }, [countries]);

  const selectedCountry = useMemo(() => {
    const appCountry = String(app?.country || '').trim();
    const byName = countryList.find(
      (country) => String(country.name || '').toLowerCase() === appCountry.toLowerCase()
    );
    if (byName) return byName;
    const byId = countryList.find((country) => country.id === app?.workflowTemplate?.countryId);
    if (byId) return byId;
    const appProfile = resolveCountryProfile(appCountry);
    if (!appCountry || appProfile === 'generic') return null;
    return countryList.find((country) => resolveCountryProfile(country.name) === appProfile) || null;
  }, [countryList, app?.country, app?.workflowTemplate?.countryId]);
  const countryId = selectedCountry?.id || '';

  useEffect(() => {
    if (!countryId) {
      setTemplates([]);
      return undefined;
    }
    let cancelled = false;
    listWorkflowTemplates({ countryId })
      .then((res) => {
        if (!cancelled) setTemplates(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setTemplates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [countryId]);

  const changeCountry = async (nextId) => {
    const country = countryList.find((item) => String(item.id) === String(nextId));
    if (!canManage || !country || saving) return;
    const sameName = String(country.name || '').toLowerCase() === String(app?.country || '').toLowerCase();
    const sameProfile =
      resolveCountryProfile(country.name) === resolveCountryProfile(app?.country) &&
      resolveCountryProfile(app?.country) !== 'generic';
    if (sameName || (sameProfile && country.id === selectedCountry?.id)) return;
    setSaving(true);
    try {
      await onUpdateMeta?.({ country: country.name });
    } finally {
      setSaving(false);
    }
  };

  const changeTemplate = async (nextId) => {
    const templateId = Number(nextId);
    if (!canManage || !templateId || templateId === app?.workflowTemplateId || saving) return;
    setSaving(true);
    try {
      await onUpdateMeta?.({ workflowTemplateId: templateId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">Destination country</label>
        <select
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-brand focus:outline-none"
          value={countryId || ''}
          disabled={!canManage || saving || !countryList.length}
          onChange={(e) => changeCountry(e.target.value)}
        >
          {!countryId ? <option value="">Select country</option> : null}
          {countryList.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-neutral-400">Changing country loads that country’s workflow (Pre-CAS, visa docs, etc.).</p>
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">Workflow template</label>
        <select
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-brand focus:outline-none"
          value={app?.workflowTemplateId || app?.workflowTemplate?.id || ''}
          disabled={!canManage || saving || !templates.length}
          onChange={(e) => changeTemplate(e.target.value)}
        >
          {!app?.workflowTemplateId && !app?.workflowTemplate?.id ? (
            <option value="">Default for country</option>
          ) : null}
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
              {template.isDefault ? ' (default)' : ''}
            </option>
          ))}
        </select>
        <a href="/student-crm/settings" className="text-[11px] font-medium text-brand hover:underline">
          Edit templates in Student CRM Settings
        </a>
      </div>
    </div>
  );
}

export default function SimpleWorkflowAccordion({
  app,
  canManage,
  counsellors = [],
  studentForm = null,
  formOptions = {},
  handlers = {},
  onSaveWorkflowProgress,
  onSaved,
  variant = 'default',
}) {
  const isDetail = variant === 'detail';
  const stages = useMemo(
    () =>
      sortWorkflowStages(
        (app?.workflowTemplate?.stages || []).filter(
          (stage) =>
            stage.sectionType !== 'SELECTION_OF_UNIVERSITY' &&
            stageAppliesToCountry(stage, app?.country || app?.workflowTemplate?.country?.name)
        )
      ),
    [app?.workflowTemplate?.stages, app?.country, app?.workflowTemplate?.country?.name]
  );
  const [openKeys, setOpenKeys] = useState([]);
  const countries = formOptions.countries || EMPTY_LIST;
  const industries = formOptions.industries || EMPTY_LIST;
  const selectedIndustry = studentForm
    ? industries.find((item) => String(item.id) === String(studentForm.industryId || ''))
    : null;
  const subjectOptions =
    selectedIndustry?.subIndustries?.length
      ? selectedIndustry.subIndustries
      : selectedIndustry?.studyAreas?.length
        ? selectedIndustry.studyAreas
        : [];
  const intakeMonths = ['Spring', 'Summer', 'Fall', 'Winter', 'January', 'May', 'September'];
  const intakeYears = Array.from({ length: 8 }, (_, index) => String(new Date().getFullYear() + index));
  const summaryItems = [
    { label: 'Student', value: app?.student?.fullName || 'Not linked', icon: UserRound },
    { label: 'University', value: app?.university || 'Pending', icon: GraduationCap },
    { label: 'Documents', value: `${app?.documents?.length || 0} files`, icon: FileText },
    { label: 'Visa', value: app?.visaTracking?.status || 'Not started', icon: ShieldCheck },
  ];

  useEffect(() => {
    setOpenKeys([]);
  }, [app?.id]);

  const [universityCatalog, setUniversityCatalog] = useState([]);
  const universityOptions = useMemo(
    () => universityCatalog.map((item) => item.name),
    [universityCatalog]
  );
  const universityCountryId = useMemo(() => {
    const templateCountryId = app?.workflowTemplate?.countryId;
    if (templateCountryId) return templateCountryId;
    const match = countries.find(
      (country) => String(country.name || '').toLowerCase() === String(app?.country || '').toLowerCase()
    );
    return match?.id || null;
  }, [app?.workflowTemplate?.countryId, app?.country, countries]);

  useEffect(() => {
    if (!universityCountryId) {
      setUniversityCatalog([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchAllUniversitiesForCountry(universityCountryId);
        if (cancelled) return;
        const seen = new Set();
        const catalog = (items || [])
          .filter((item) => item?.id && item?.name && !seen.has(item.name) && seen.add(item.name))
          .map((item) => ({ id: item.id, name: item.name }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setUniversityCatalog(catalog);
      } catch {
        if (!cancelled) setUniversityCatalog([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [universityCountryId]);

  const toggle = (key) =>
    setOpenKeys((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));

  const FILE_STAGES = new Set([
    'APPLICATION_PROCESS',
    'PRE_CAS_PROCESS',
    'VISA_APPLICATION',
    'PRE_DEPARTURE',
    'ON_ARRIVAL',
    'ENROLMENT_CONFIRMATION',
  ]);

  const renderStageContent = (stage) => {
    if (isDetail) {
      if (stage.sectionType === 'LOGS_INFO') return <AuditTimeline app={app} />;
      if (stage.sectionType === 'STUDENT_INFO') {
        return (
          <StudentInfoPanel
            student={app.student}
            canManage={canManage}
            counsellors={counsellors}
            formOptions={formOptions}
            onSave={handlers.onSaveStudentInfo}
          />
        );
      }
      if (FILE_STAGES.has(stage.sectionType)) {
        return (
          <GatheringChecklist
            app={app}
            stage={stage}
            canManage={canManage}
            handlers={handlers}
            onSaveWorkflowProgress={onSaveWorkflowProgress}
            onSaved={onSaved}
            ownsUnmatched={stage.sectionType === 'APPLICATION_PROCESS'}
          />
        );
      }
      if (stage.sectionType === 'UNIVERSITY_APPLICATION') {
        return (
          <UniversityApplicationPanel
            app={app}
            stage={stage}
            canManage={canManage}
            countryId={universityCountryId}
            universityCatalog={universityCatalog}
            onUpdateMeta={handlers.onUpdateMeta}
            onSaved={onSaved}
          />
        );
      }
      if (stage.sectionType === 'FINANCE_CALCULATOR') {
        return <StaffApplicationFees app={app} canManage={canManage} onSaved={onSaved} />;
      }
      if (stage.sectionType === 'DISCUSSIONS') {
        return (
          <DiscussionThread
            applicationId={app.id}
            canManage={canManage}
            currentUserId={handlers.currentUserId}
            initialComments={app.comments}
          />
        );
      }
      return (
        <GenericWorkflowSection
          app={app}
          stage={stage}
          canManage={canManage}
          onSaveProgress={onSaveWorkflowProgress}
          onSaved={onSaved}
          variant="detail"
          universityOptions={universityOptions}
        />
      );
    }
    switch (stage.sectionType) {
      case 'STUDENT_INFO':
        return (
          <div className="space-y-4">
            {studentForm ? (
              <div className="ui-panel p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="ui-text-caption">First name</label>
                  <input
                    className="ui-field"
                    value={studentForm.firstName || ''}
                    disabled={!canManage}
                    onChange={(e) => handlers.onStudentFieldChange?.('firstName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="ui-text-caption">Last name</label>
                  <input
                    className="ui-field"
                    value={studentForm.lastName || ''}
                    disabled={!canManage}
                    onChange={(e) => handlers.onStudentFieldChange?.('lastName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="ui-text-caption">Full name</label>
                  <input
                    className="ui-field"
                    value={studentForm.fullName || ''}
                    disabled={!canManage}
                    onChange={(e) => handlers.onStudentFieldChange?.('fullName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="ui-text-caption">Email</label>
                  <input className="ui-field" value={studentForm.email || ''} disabled />
                </div>
                <div>
                  <label className="ui-text-caption">Phone</label>
                  <input
                    className="ui-field"
                    value={studentForm.phone || ''}
                    disabled={!canManage}
                    onChange={(e) => handlers.onStudentFieldChange?.('phone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="ui-text-caption">Study industry</label>
                  <select
                    className="ui-field"
                    value={studentForm.industryId || ''}
                    disabled={!canManage}
                    onChange={(e) => {
                      handlers.onStudentFieldChange?.('industryId', e.target.value);
                      handlers.onStudentFieldChange?.('subIndustryId', '');
                      handlers.onStudentFieldChange?.('studyAreaId', '');
                    }}
                  >
                    <option value="">Select industry</option>
                    {industries.map((industry) => (
                      <option key={industry.id} value={industry.id}>
                        {industry.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="ui-text-caption">Subject industry</label>
                  <select
                    className="ui-field"
                    value={studentForm.subIndustryId || studentForm.studyAreaId || ''}
                    disabled={!canManage}
                    onChange={(e) => handlers.onStudentFieldChange?.('subIndustryId', e.target.value)}
                  >
                    <option value="">Select subject</option>
                    {subjectOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="ui-text-caption">Email</label>
                  <input className="ui-field" value={studentForm.email || ''} disabled />
                </div>
                <div>
                  <label className="ui-text-caption">Intake</label>
                  <select
                    className="ui-field"
                    value={studentForm.intakeMonth || ''}
                    disabled={!canManage}
                    onChange={(e) => handlers.onStudentFieldChange?.('intakeMonth', e.target.value)}
                  >
                    <option value="">Select intake</option>
                    {intakeMonths.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="ui-text-caption">Intake year</label>
                  <select
                    className="ui-field"
                    value={studentForm.intakeYear || ''}
                    disabled={!canManage}
                    onChange={(e) => handlers.onStudentFieldChange?.('intakeYear', e.target.value)}
                  >
                    <option value="">Select year</option>
                    {intakeYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="ui-text-caption">Study destination</label>
                  <select
                    className="ui-field"
                    value={studentForm.countryId || ''}
                    disabled={!canManage}
                    onChange={(e) => {
                      const country = countries.find((item) => String(item.id) === e.target.value);
                      handlers.onStudentFieldChange?.('countryId', e.target.value);
                      handlers.onStudentFieldChange?.('preferredCountry', country?.name || '');
                    }}
                  >
                    <option value="">Select destination</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="ui-text-caption">POC</label>
                  <select
                    className="ui-field"
                    value={studentForm.contactId || ''}
                    disabled={!canManage}
                    onChange={(e) => handlers.onStudentFieldChange?.('contactId', e.target.value)}
                  >
                    <option value="">Select POC</option>
                    {counsellors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="ui-text-caption">Study level</label>
                  <select
                    className="ui-field"
                    value={studentForm.level || ''}
                    disabled={!canManage}
                    onChange={(e) => handlers.onStudentFieldChange?.('level', e.target.value)}
                  >
                    <option value="">Select level</option>
                    {['Diploma', 'Bachelor', 'Master', 'PhD', 'Certificate'].map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
                {canManage && handlers.onSaveStudentInfo ? (
                  <div className="md:col-span-2 flex justify-end">
                    <button type="button" className="ui-btn-primary" onClick={handlers.onSaveStudentInfo}>
                      Save student information
                    </button>
                  </div>
                ) : null}
              </div>
            ) : handlers.onUpdateMeta ? (
              <ApplicationMetaEditor app={app} counsellors={counsellors} canManage={canManage} onSave={handlers.onUpdateMeta} />
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                <div className="ui-surface p-3"><p className="ui-text-caption">Student</p><p className="ui-text-strong mt-1">{app.student?.fullName || '—'}</p></div>
                <div className="ui-surface p-3"><p className="ui-text-caption">Country</p><p className="ui-text-strong mt-1">{app.country || '—'}</p></div>
                <div className="ui-surface p-3"><p className="ui-text-caption">University</p><p className="ui-text-strong mt-1">{app.university || '—'}</p></div>
                <div className="ui-surface p-3"><p className="ui-text-caption">Course</p><p className="ui-text-strong mt-1">{app.course || '—'}</p></div>
              </div>
            )}
          </div>
        );
      case 'APPLICATION_PROCESS':
        return (
          <GatheringChecklist
            app={app}
            stage={stage}
            canManage={canManage}
            handlers={handlers}
            onSaveWorkflowProgress={onSaveWorkflowProgress}
            onSaved={onSaved}
            ownsUnmatched
          />
        );
      case 'UNIVERSITY_APPLICATION':
        return (
          <UniversityApplicationPanel
            app={app}
            stage={stage}
            canManage={canManage}
            countryId={universityCountryId}
            universityCatalog={universityCatalog}
            onUpdateMeta={handlers.onUpdateMeta}
            onSaved={onSaved}
          />
        );
      case 'FINANCE_CALCULATOR':
        return <StaffApplicationFees app={app} canManage={canManage} onSaved={onSaved} />;
      case 'VISA_APPLICATION':
      case 'PRE_CAS_PROCESS':
      case 'PRE_DEPARTURE':
      case 'ON_ARRIVAL':
      case 'ENROLMENT_CONFIRMATION':
        return (
          <GatheringChecklist
            app={app}
            stage={stage}
            canManage={canManage}
            handlers={handlers}
            onSaveWorkflowProgress={onSaveWorkflowProgress}
            onSaved={onSaved}
            ownsUnmatched={false}
          />
        );
      case 'LOGS_INFO':
        return <AuditTimeline app={app} />;
      default:
        return <GenericWorkflowSection app={app} stage={stage} canManage={canManage} onSaveProgress={onSaveWorkflowProgress} onSaved={onSaved} variant={variant} universityOptions={universityOptions} />;
    }
  };

  if (!app) {
    return <div className="ui-panel p-8 text-center text-sm text-neutral-500">Select an application to view its workflow.</div>;
  }

  return (
    <div className={isDetail ? 'space-y-4 rounded-[28px] border border-neutral-200 bg-neutral-50 p-3 md:p-4' : 'space-y-3'}>
      {isDetail ? (
        <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 md:px-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand/70">View Student Detail</p>
              <h3 className="mt-1 text-xl font-semibold text-brand">{app?.student?.fullName || app?.applicationCode || 'Workflow'}</h3>
              <p className="mt-1 text-sm text-neutral-500">
                {app?.country || 'Country not set'} · {app?.course || 'Course not set'} · {app?.workflowTemplate?.name || 'Default workflow'}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <CircleDot size={12} />
              {app?.stage || 'DRAFT'}
            </div>
          </div>
          <DestinationTemplateSwitcher
            app={app}
            canManage={canManage}
            countries={countries}
            onUpdateMeta={handlers.onUpdateMeta}
          />
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {summaryItems.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-neutral-200 bg-neutral-50/70 px-4 py-3">
                <div className="flex items-center gap-2 text-neutral-500">
                  <Icon size={14} />
                  <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-brand">{value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {stages.map((stage, index) => {
        const isOpen = openKeys.includes(stage.key);
        const Icon = getWorkflowIcon(stage.iconKey);
        const complete = isWorkflowStageComplete(stage, app);
        return (
          <div
            key={stage.key}
            className={
              isDetail
                ? 'overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm'
                : 'ui-surface overflow-hidden'
            }
          >
            <button
              type="button"
              onClick={() => toggle(stage.key)}
              className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-neutral-50/60 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    complete ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${complete ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {index + 1}. {displayStageLabel(stage)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {complete ? 'Details filled' : 'Fields still need to be filled'}
                  </p>
                </div>
              </div>
              <ChevronDown size={16} className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div
                className={
                  isDetail
                    ? 'border-t border-neutral-100 bg-neutral-50/40 px-5 pb-5 pt-5'
                    : 'px-5 pb-5 border-t border-neutral-100 pt-5 bg-neutral-50/30'
                }
              >
                {renderStageContent(stage)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
