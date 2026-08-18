'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import {
  cloneWorkflowTemplate,
  createWorkflowTemplate,
  deleteWorkflowTemplate,
  listWorkflowTemplates,
  resetWorkflowTemplate,
  updateWorkflowTemplate,
} from '@/services/studentCrmApi';
import { getWorkflowIcon, WORKFLOW_ICON_OPTIONS, workflowSectionTypeLabel } from '@/features/student-crm/workflowTemplateUi';

const SECTION_TYPES = [
  'STUDENT_INFO',
  'DISCUSSIONS',
  'APPLICATION_PROCESS',
  'UNIVERSITY_APPLICATION',
  'FINANCE_CALCULATOR',
  'PRE_CAS_PROCESS',
  'VISA_APPLICATION',
  'PRE_DEPARTURE',
  'ON_ARRIVAL',
  'ENROLMENT_CONFIRMATION',
  'LOGS_INFO',
];

const emptyStage = (index = 0) => ({
  key: `custom_stage_${index + 1}`,
  label: `Custom Stage ${index + 1}`,
  iconKey: 'ListChecks',
  sectionType: 'APPLICATION_PROCESS',
  sortOrder: index,
  isRequired: true,
  fields: [],
  checklists: [],
});

const normalizeTemplateForEdit = (template) => ({
  id: template?.id || null,
  countryId: template?.countryId ?? template?.country?.id ?? '',
  name: template?.name || '',
  description: template?.description || '',
  isActive: template?.isActive !== false,
  isDefault: Boolean(template?.isDefault),
  stages: Array.isArray(template?.stages)
    ? template.stages.map((stage, stageIndex) => ({
        key: stage.key,
        label: stage.label,
        iconKey: stage.iconKey || 'ListChecks',
        sectionType: stage.sectionType,
        sortOrder: stage.sortOrder ?? stageIndex,
        isRequired: stage.isRequired !== false,
        fields: Array.isArray(stage.fields)
          ? stage.fields.map((field, fieldIndex) => ({
              fieldKey: field.fieldKey,
              label: field.label,
              fieldType: field.fieldType,
              required: Boolean(field.required),
              placeholder: field.placeholder || '',
              helpText: field.helpText || '',
              sortOrder: field.sortOrder ?? fieldIndex,
            }))
          : [],
        checklists: Array.isArray(stage.checklists)
          ? stage.checklists.map((item, itemIndex) => ({
              itemKey: item.itemKey,
              label: item.label,
              required: item.required !== false,
              sortOrder: item.sortOrder ?? itemIndex,
            }))
          : [],
      }))
    : [emptyStage(0)],
});

export default function WorkflowTemplateAdmin({ countries = [], canManage, onMessage }) {
  const [countryId, setCountryId] = useState('');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(() => normalizeTemplateForEdit(null));

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId) || null,
    [templates, selectedId]
  );

  const loadTemplates = async (nextCountryId = countryId) => {
    setLoading(true);
    try {
      const res = await listWorkflowTemplates({ countryId: nextCountryId || undefined });
      const rows = Array.isArray(res?.data) ? res.data : [];
      setTemplates(rows);
      if (!rows.length) {
        setSelectedId(null);
        setForm(normalizeTemplateForEdit({ countryId: nextCountryId || '' }));
      } else if (!rows.some((row) => row.id === selectedId)) {
        setSelectedId(rows[0].id);
        setForm(normalizeTemplateForEdit(rows[0]));
      }
    } catch (err) {
      onMessage?.(err.message || 'Failed to load workflow templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates().catch(() => {});
  }, [countryId]);

  useEffect(() => {
    if (selectedTemplate) {
      setForm(normalizeTemplateForEdit(selectedTemplate));
    }
  }, [selectedTemplate]);

  const updateStage = (index, updater) => {
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.map((stage, stageIndex) =>
        stageIndex === index ? { ...stage, ...updater, sortOrder: index } : stage
      ),
    }));
  };

  const addField = (stageIndex) => {
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.map((stage, idx) =>
        idx === stageIndex
          ? {
              ...stage,
              fields: [
                ...stage.fields,
                {
                  fieldKey: `field_${stage.fields.length + 1}`,
                  label: `Field ${stage.fields.length + 1}`,
                  fieldType: 'TEXT',
                  required: false,
                  placeholder: '',
                  helpText: '',
                  sortOrder: stage.fields.length,
                },
              ],
            }
          : stage
      ),
    }));
  };

  const addChecklist = (stageIndex) => {
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.map((stage, idx) =>
        idx === stageIndex
          ? {
              ...stage,
              checklists: [
                ...stage.checklists,
                {
                  itemKey: `item_${stage.checklists.length + 1}`,
                  label: `Checklist item ${stage.checklists.length + 1}`,
                  required: true,
                  sortOrder: stage.checklists.length,
                },
              ],
            }
          : stage
      ),
    }));
  };

  const saveTemplate = async () => {
    try {
      if (!form.name.trim()) {
        onMessage?.('Template name is required');
        return;
      }
      const payload = {
        ...form,
        countryId: form.countryId ? Number(form.countryId) : null,
        stages: form.stages.map((stage, stageIndex) => ({
          ...stage,
          key: stage.key || `stage_${stageIndex + 1}`,
          sortOrder: stageIndex,
          fields: stage.fields.map((field, fieldIndex) => ({
            ...field,
            fieldKey: field.fieldKey || `field_${fieldIndex + 1}`,
            sortOrder: fieldIndex,
          })),
          checklists: stage.checklists.map((item, itemIndex) => ({
            ...item,
            itemKey: item.itemKey || `item_${itemIndex + 1}`,
            sortOrder: itemIndex,
          })),
        })),
      };
      if (form.id) {
        await updateWorkflowTemplate(form.id, payload);
        onMessage?.('Workflow template updated');
      } else {
        const res = await createWorkflowTemplate(payload);
        onMessage?.('Workflow template created');
        setSelectedId(res?.data?.id || null);
      }
      await loadTemplates();
    } catch (err) {
      onMessage?.(err.message || 'Failed to save workflow template');
    }
  };

  const removeTemplate = async (id) => {
    if (!window.confirm('Delete this workflow template?')) return;
    try {
      await deleteWorkflowTemplate(id);
      onMessage?.('Workflow template deleted');
      await loadTemplates();
    } catch (err) {
      onMessage?.(err.message || 'Delete failed');
    }
  };

  const restoreTemplate = async (id) => {
    if (!window.confirm('Restore the default 12 steps? Saved progress for this template is cleared.')) return;
    try {
      await resetWorkflowTemplate(id);
      onMessage?.('Workflow template restored to default steps');
      await loadTemplates();
    } catch (err) {
      onMessage?.(err.message || 'Restore failed');
    }
  };

  const duplicateTemplate = async (id) => {
    try {
      await cloneWorkflowTemplate(id);
      onMessage?.('Workflow template cloned');
      await loadTemplates();
    } catch (err) {
      onMessage?.(err.message || 'Clone failed');
    }
  };

  return (
    <div className="ui-panel p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="font-semibold text-sm">Country workflow templates</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Admin-editable custom modules that drive stage names, icons, fields, and checklists per country.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select className="ui-field min-w-[220px]" value={countryId} onChange={(e) => setCountryId(e.target.value)}>
            <option value="">All countries</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
          {canManage && (
            <button
              type="button"
              className="ui-btn-primary"
              onClick={() => {
                setSelectedId(null);
                setForm(normalizeTemplateForEdit({ countryId, stages: [emptyStage(0)] }));
              }}
            >
              <Plus size={14} /> New template
            </button>
          )}
        </div>
      </div>

      <div className="grid xl:grid-cols-[320px_minmax(0,1fr)] gap-4">
        <div className="ui-surface p-4 space-y-3">
          {loading ? (
            <p className="text-sm text-neutral-500">Loading workflow templates...</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-neutral-500">No custom module templates yet for this country.</p>
          ) : (
            templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedId(template.id)}
                className={`w-full text-left rounded-xl border px-3 py-3 transition ${
                  template.id === selectedId
                    ? 'border-brand bg-brand/5'
                    : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm text-brand">{template.name}</p>
                  {template.isDefault && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Default
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {template.country?.name || 'No country'} · {template.stages?.length || 0} sections
                </p>
              </button>
            ))
          )}
        </div>

        <div className="ui-surface p-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="ui-text-caption">Template name</label>
              <input className="ui-field" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <label className="ui-text-caption">Country</label>
              <select
                className="ui-field"
                value={form.countryId}
                onChange={(e) => setForm((prev) => ({ ...prev, countryId: e.target.value }))}
              >
                <option value="">Select country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="ui-text-caption">Description</label>
              <textarea
                className="ui-field"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              Active
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
              />
              Default for country
            </label>
          </div>

          <div className="space-y-4">
            {form.stages.map((stage, stageIndex) => {
              const StageIcon = getWorkflowIcon(stage.iconKey);
              return (
                <div key={`${stage.key}-${stageIndex}`} className="ui-panel p-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                        <StageIcon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-brand">{stage.label}</p>
                        <p className="text-xs text-neutral-500">{workflowSectionTypeLabel(stage.sectionType)}</p>
                      </div>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        className="text-rose-600 hover:text-rose-700"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            stages: prev.stages.filter((_, idx) => idx !== stageIndex).map((row, idx) => ({ ...row, sortOrder: idx })),
                          }))
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid lg:grid-cols-4 gap-3">
                    <div>
                      <label className="ui-text-caption">Label</label>
                      <input className="ui-field" value={stage.label} onChange={(e) => updateStage(stageIndex, { label: e.target.value })} />
                    </div>
                    <div>
                      <label className="ui-text-caption">Key</label>
                      <input className="ui-field" value={stage.key} onChange={(e) => updateStage(stageIndex, { key: e.target.value })} />
                    </div>
                    <div>
                      <label className="ui-text-caption">Section type</label>
                      <select
                        className="ui-field"
                        value={stage.sectionType}
                        onChange={(e) => updateStage(stageIndex, { sectionType: e.target.value })}
                      >
                        {SECTION_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {workflowSectionTypeLabel(type)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="ui-text-caption">Icon</label>
                      <select
                        className="ui-field"
                        value={stage.iconKey}
                        onChange={(e) => updateStage(stageIndex, { iconKey: e.target.value })}
                      >
                        {WORKFLOW_ICON_OPTIONS.map((icon) => (
                          <option key={icon} value={icon}>
                            {icon}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid xl:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-brand">Fields</p>
                        {canManage && (
                          <button type="button" className="ui-btn-secondary" onClick={() => addField(stageIndex)}>
                            <Plus size={13} /> Add field
                          </button>
                        )}
                      </div>
                      {stage.fields.length === 0 ? (
                        <p className="text-xs text-neutral-500">No custom fields for this section.</p>
                      ) : (
                        stage.fields.map((field, fieldIndex) => (
                          <div key={`${field.fieldKey}-${fieldIndex}`} className="rounded-xl border border-neutral-200 p-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                className="ui-field"
                                value={field.label}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    stages: prev.stages.map((row, idx) =>
                                      idx === stageIndex
                                        ? {
                                            ...row,
                                            fields: row.fields.map((entry, idx2) =>
                                              idx2 === fieldIndex ? { ...entry, label: e.target.value } : entry
                                            ),
                                          }
                                        : row
                                    ),
                                  }))
                                }
                              />
                              <select
                                className="ui-field"
                                value={field.fieldType}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    stages: prev.stages.map((row, idx) =>
                                      idx === stageIndex
                                        ? {
                                            ...row,
                                            fields: row.fields.map((entry, idx2) =>
                                              idx2 === fieldIndex ? { ...entry, fieldType: e.target.value } : entry
                                            ),
                                          }
                                        : row
                                    ),
                                  }))
                                }
                              >
                                {['TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'URL', 'CURRENCY', 'CHECKBOX', 'SELECT'].map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-brand">Checklist items</p>
                        {canManage && (
                          <button type="button" className="ui-btn-secondary" onClick={() => addChecklist(stageIndex)}>
                            <Plus size={13} /> Add item
                          </button>
                        )}
                      </div>
                      {stage.checklists.length === 0 ? (
                        <p className="text-xs text-neutral-500">No checklist items for this section.</p>
                      ) : (
                        stage.checklists.map((item, itemIndex) => (
                          <div key={`${item.itemKey}-${itemIndex}`} className="rounded-xl border border-neutral-200 p-3 flex gap-3 items-center">
                            <input
                              className="ui-field flex-1"
                              value={item.label}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  stages: prev.stages.map((row, idx) =>
                                    idx === stageIndex
                                      ? {
                                          ...row,
                                          checklists: row.checklists.map((entry, idx2) =>
                                            idx2 === itemIndex ? { ...entry, label: e.target.value } : entry
                                          ),
                                        }
                                      : row
                                  ),
                                }))
                              }
                            />
                            <label className="text-xs inline-flex items-center gap-2 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={item.required !== false}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    stages: prev.stages.map((row, idx) =>
                                      idx === stageIndex
                                        ? {
                                            ...row,
                                            checklists: row.checklists.map((entry, idx2) =>
                                              idx2 === itemIndex ? { ...entry, required: e.target.checked } : entry
                                            ),
                                          }
                                        : row
                                    ),
                                  }))
                                }
                              />
                              Required
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {canManage && (
              <button
                type="button"
                className="ui-btn-secondary"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    stages: [...prev.stages, emptyStage(prev.stages.length)],
                  }))
                }
              >
                <Plus size={14} /> Add section
              </button>
            )}
          </div>

          {canManage && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="ui-btn-primary" onClick={saveTemplate}>
                <Save size={14} /> Save template
              </button>
              {form.id && (
                <>
                  <button type="button" className="ui-btn-secondary" onClick={() => duplicateTemplate(form.id)}>
                    <Copy size={14} /> Clone
                  </button>
                  <button type="button" className="ui-btn-secondary" onClick={() => restoreTemplate(form.id)}>
                    <RotateCcw size={14} /> Restore defaults
                  </button>
                  <button type="button" className="ui-btn-secondary text-rose-600" onClick={() => removeTemplate(form.id)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
