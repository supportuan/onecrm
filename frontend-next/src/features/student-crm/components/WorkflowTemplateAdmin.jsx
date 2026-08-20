'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Copy, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import {
  cloneWorkflowTemplate,
  createWorkflowTemplate,
  deleteWorkflowTemplate,
  listWorkflowTemplates,
  resetWorkflowTemplate,
  updateWorkflowTemplate,
} from '@/services/studentCrmApi';
import {
  EXAM_SCORE_TEMPLATE_FIELDS,
  SERVICE_FEE_TEMPLATE_FIELDS,
  workflowSectionTypeLabel,
} from '@/features/student-crm/workflowTemplateUi';

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
              optionsJson: field.optionsJson ?? null,
              metadata: field.metadata ?? null,
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
  const [expandedStage, setExpandedStage] = useState(0);
  const [showOptions, setShowOptions] = useState(false);

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
      setExpandedStage(0);
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

  const appendPresetFields = (stageIndex, presets) => {
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.map((stage, idx) => {
        if (idx !== stageIndex) return stage;
        const existing = new Set(stage.fields.map((field) => field.fieldKey));
        const extra = presets.filter((field) => !existing.has(field.fieldKey)).map(
          (field, fieldIndex) => ({
            fieldKey: field.fieldKey,
            label: field.label,
            fieldType: field.fieldType,
            required: field.required !== false,
            placeholder: field.placeholder || '',
            helpText: field.helpText || '',
            sortOrder: stage.fields.length + fieldIndex,
            optionsJson: field.optionsJson,
            metadata: field.metadata ?? null,
          })
        );
        return extra.length ? { ...stage, fields: [...stage.fields, ...extra] } : stage;
      }),
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
                  required: true,
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
        onMessage?.('Template saved');
      } else {
        const res = await createWorkflowTemplate(payload);
        onMessage?.('Template created');
        setSelectedId(res?.data?.id || null);
      }
      await loadTemplates();
    } catch (err) {
      onMessage?.(err.message || 'Failed to save template');
    }
  };

  const removeTemplate = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await deleteWorkflowTemplate(id);
      onMessage?.('Template deleted');
      await loadTemplates();
    } catch (err) {
      onMessage?.(err.message || 'Delete failed');
    }
  };

  const restoreTemplate = async (id) => {
    if (!window.confirm('Restore default steps? This resets the template structure.')) return;
    try {
      await resetWorkflowTemplate(id);
      onMessage?.('Template restored to defaults');
      await loadTemplates();
    } catch (err) {
      onMessage?.(err.message || 'Restore failed');
    }
  };

  const duplicateTemplate = async (id) => {
    try {
      await cloneWorkflowTemplate(id);
      onMessage?.('Template cloned');
      await loadTemplates();
    } catch (err) {
      onMessage?.(err.message || 'Clone failed');
    }
  };

  const selectTemplate = (id) => {
    if (id === 'new') {
      setSelectedId(null);
      setForm(normalizeTemplateForEdit({ countryId, stages: [emptyStage(0)] }));
      setExpandedStage(0);
      return;
    }
    const template = templates.find((row) => row.id === Number(id));
    if (template) {
      setSelectedId(template.id);
      setForm(normalizeTemplateForEdit(template));
      setExpandedStage(0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[160px] flex-1">
          <label className="text-xs text-neutral-500">Filter by country</label>
          <select className="ui-field mt-1" value={countryId} onChange={(e) => setCountryId(e.target.value)}>
            <option value="">All countries</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px] flex-[2]">
          <label className="text-xs text-neutral-500">Template</label>
          <select
            className="ui-field mt-1"
            value={selectedId ?? (form.id ? form.id : 'new')}
            onChange={(e) => selectTemplate(e.target.value)}
            disabled={loading}
          >
            {canManage ? <option value="new">+ New template</option> : null}
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
                {template.isDefault ? ' (default)' : ''}
                {template.country?.name ? ` — ${template.country.name}` : ''}
              </option>
            ))}
          </select>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="ui-btn-primary" onClick={saveTemplate}>
              <Save size={14} /> Save
            </button>
            {form.id ? (
              <>
                <button type="button" className="ui-btn-secondary" onClick={() => restoreTemplate(form.id)}>
                  <RotateCcw size={14} /> Reset
                </button>
                <button type="button" className="ui-btn-secondary" onClick={() => duplicateTemplate(form.id)}>
                  <Copy size={14} /> Clone
                </button>
                <button type="button" className="ui-btn-secondary text-rose-600" onClick={() => removeTemplate(form.id)}>
                  <Trash2 size={14} />
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading templates…</p>
      ) : templates.length === 0 && !form.name && !canManage ? (
        <p className="text-sm text-neutral-500">No templates available.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-neutral-500">Template name</label>
              <input
                className="ui-field mt-1"
                value={form.name}
                disabled={!canManage}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. United Kingdom default"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500">Country</label>
              <select
                className="ui-field mt-1"
                value={form.countryId}
                disabled={!canManage}
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
          </div>

          {canManage ? (
            <button
              type="button"
              className="text-xs text-neutral-500 hover:text-brand"
              onClick={() => setShowOptions((open) => !open)}
            >
              {showOptions ? 'Hide' : 'Show'} extra options
            </button>
          ) : null}

          {showOptions ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-3 space-y-3">
              <div>
                <label className="text-xs text-neutral-500">Description</label>
                <textarea
                  className="ui-field mt-1"
                  rows={2}
                  value={form.description}
                  disabled={!canManage}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    disabled={!canManage}
                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  />
                  Active
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    disabled={!canManage}
                    onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                  />
                  Default for country
                </label>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Sections ({form.stages.length})
            </p>
            {form.stages.map((stage, stageIndex) => {
              const open = expandedStage === stageIndex;
              const summary = [
                stage.fields.length ? `${stage.fields.length} fields` : null,
                stage.checklists.length ? `${stage.checklists.length} checklist` : null,
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <div key={`${stage.key}-${stageIndex}`} className="rounded-xl border border-neutral-200 overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-neutral-50/80"
                    onClick={() => setExpandedStage(open ? -1 : stageIndex)}
                  >
                    <div>
                      <p className="text-sm font-medium text-brand">
                        {stageIndex + 1}. {stage.label}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {workflowSectionTypeLabel(stage.sectionType)}
                        {summary ? ` · ${summary}` : ''}
                      </p>
                    </div>
                    <ChevronDown size={16} className={`shrink-0 text-neutral-400 transition ${open ? 'rotate-180' : ''}`} />
                  </button>

                  {open ? (
                    <div className="border-t border-neutral-100 px-4 py-4 space-y-4 bg-neutral-50/40">
                      <div>
                        <label className="text-xs text-neutral-500">Section name</label>
                        <input
                          className="ui-field mt-1"
                          value={stage.label}
                          disabled={!canManage}
                          onChange={(e) => updateStage(stageIndex, { label: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium text-neutral-700">Fields</p>
                          {canManage ? (
                            <div className="flex flex-wrap gap-1">
                              {stage.sectionType === 'STUDENT_INFO' &&
                              EXAM_SCORE_TEMPLATE_FIELDS.some(
                                (field) => !stage.fields.some((entry) => entry.fieldKey === field.fieldKey)
                              ) ? (
                                <button
                                  type="button"
                                  className="text-xs text-brand hover:underline"
                                  onClick={() => appendPresetFields(stageIndex, EXAM_SCORE_TEMPLATE_FIELDS)}
                                >
                                  + Exam scores
                                </button>
                              ) : null}
                              {stage.sectionType === 'FINANCE_CALCULATOR' &&
                              SERVICE_FEE_TEMPLATE_FIELDS.some(
                                (field) => !stage.fields.some((entry) => entry.fieldKey === field.fieldKey)
                              ) ? (
                                <button
                                  type="button"
                                  className="text-xs text-brand hover:underline"
                                  onClick={() => appendPresetFields(stageIndex, SERVICE_FEE_TEMPLATE_FIELDS)}
                                >
                                  + Service fees
                                </button>
                              ) : null}
                              <button type="button" className="text-xs text-brand hover:underline" onClick={() => addField(stageIndex)}>
                                + Field
                              </button>
                            </div>
                          ) : null}
                        </div>
                        {stage.fields.length === 0 ? (
                          <p className="text-xs text-neutral-500">No fields.</p>
                        ) : (
                          <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-100 bg-white">
                            {stage.fields.map((field, fieldIndex) => (
                              <li key={`${field.fieldKey}-${fieldIndex}`} className="flex items-center gap-2 px-3 py-2">
                                <input
                                  className="ui-field flex-1 py-1.5 text-sm"
                                  value={field.label}
                                  disabled={!canManage}
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
                                <label className="inline-flex shrink-0 items-center gap-1 text-xs text-neutral-600">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(field.required)}
                                    disabled={!canManage}
                                    onChange={(e) =>
                                      setForm((prev) => ({
                                        ...prev,
                                        stages: prev.stages.map((row, idx) =>
                                          idx === stageIndex
                                            ? {
                                                ...row,
                                                fields: row.fields.map((entry, idx2) =>
                                                  idx2 === fieldIndex ? { ...entry, required: e.target.checked } : entry
                                                ),
                                              }
                                            : row
                                        ),
                                      }))
                                    }
                                  />
                                  Req
                                </label>
                                {canManage ? (
                                  <button
                                    type="button"
                                    className="shrink-0 text-neutral-400 hover:text-rose-600"
                                    onClick={() =>
                                      setForm((prev) => ({
                                        ...prev,
                                        stages: prev.stages.map((row, idx) =>
                                          idx === stageIndex
                                            ? { ...row, fields: row.fields.filter((_, idx2) => idx2 !== fieldIndex) }
                                            : row
                                        ),
                                      }))
                                    }
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium text-neutral-700">Checklist</p>
                          {canManage ? (
                            <button type="button" className="text-xs text-brand hover:underline" onClick={() => addChecklist(stageIndex)}>
                              + Item
                            </button>
                          ) : null}
                        </div>
                        {stage.checklists.length === 0 ? (
                          <p className="text-xs text-neutral-500">No checklist items.</p>
                        ) : (
                          <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-100 bg-white">
                            {stage.checklists.map((item, itemIndex) => (
                              <li key={`${item.itemKey}-${itemIndex}`} className="flex items-center gap-2 px-3 py-2">
                                <input
                                  className="ui-field flex-1 py-1.5 text-sm"
                                  value={item.label}
                                  disabled={!canManage}
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
                                <label className="inline-flex shrink-0 items-center gap-1 text-xs text-neutral-600">
                                  <input
                                    type="checkbox"
                                    checked={item.required !== false}
                                    disabled={!canManage}
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
                                  Req
                                </label>
                                {canManage ? (
                                  <button
                                    type="button"
                                    className="shrink-0 text-neutral-400 hover:text-rose-600"
                                    onClick={() =>
                                      setForm((prev) => ({
                                        ...prev,
                                        stages: prev.stages.map((row, idx) =>
                                          idx === stageIndex
                                            ? {
                                                ...row,
                                                checklists: row.checklists.filter((_, idx2) => idx2 !== itemIndex),
                                              }
                                            : row
                                        ),
                                      }))
                                    }
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
