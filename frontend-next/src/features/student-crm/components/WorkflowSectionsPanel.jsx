'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  CheckSquare,
  FileText,
  History,
  Plane,
} from 'lucide-react';
import {
  ApplicationMetaEditor,
  ApplicationTasksPanel,
  AuditTimeline,
  DocumentChecklist,
  OfferLetterPanel,
  VisaPanel,
} from './ApplicationParts';
import StaffApplicationFees from './StaffApplicationFees';
import ServiceFeesPanel from './ServiceFeesPanel';
import { getWorkflowIcon, isTemplateFieldSubmitted } from '../workflowTemplateUi';
import { toDateInputValue } from '../dateFormat';
import RequiredStatusIcon from './RequiredStatusIcon';

const fallbackTabs = [
  { key: 'overview', label: 'Overview', icon: FileText, sectionType: 'STUDENT_INFO' },
  { key: 'documents', label: 'Documents', icon: FileText, sectionType: 'APPLICATION_PROCESS' },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare, sectionType: 'DISCUSSIONS' },
  { key: 'offer', label: 'Offer', icon: Briefcase, sectionType: 'UNIVERSITY_APPLICATION' },
  { key: 'visa', label: 'Visa', icon: Plane, sectionType: 'VISA_APPLICATION' },
  { key: 'history', label: 'History', icon: History, sectionType: 'LOGS_INFO' },
];

function GenericWorkflowSection({ app, stage, canManage, onSaveProgress, onSaved }) {
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
  }, [stage, valueMap, checklistMap]);

  const save = async () => {
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

  const renderInput = (field) => {
    const value = fieldValues[field.id] ?? '';
    const common = {
      className: 'ui-field',
      value,
      onChange: (e) => setFieldValues((prev) => ({ ...prev, [field.id]: e.target.value })),
      placeholder: field.placeholder || '',
      disabled: !canManage,
    };
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
          {field.required ? <RequiredStatusIcon submitted={isTemplateFieldSubmitted(field, fieldValues, stage)} /> : null}
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
    if (field.fieldType === 'SELECT' && Array.isArray(field.optionsJson)) {
      return (
        <select
          className="ui-field"
          value={value}
          disabled={!canManage}
          onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
        >
          <option value="">Select</option>
          {field.optionsJson.map((option) => (
            <option key={String(option?.value || option)} value={String(option?.value || option)}>
              {String(option?.label || option)}
            </option>
          ))}
        </select>
      );
    }
    return <input type="text" {...common} />;
  };

  return (
    <div className="space-y-5">
      {!!stage.fields?.length && (
        <div className="ui-panel p-4 space-y-3">
          <h4 className="text-sm font-semibold text-brand">Section fields</h4>
          <div className="grid md:grid-cols-2 gap-3">
            {stage.fields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                {field.fieldType !== 'CHECKBOX' && (
                  <label className="ui-text-caption inline-flex items-center gap-1.5">
                    {field.required ? (
                      <RequiredStatusIcon submitted={isTemplateFieldSubmitted(field, fieldValues, stage)} />
                    ) : null}
                    {field.label}
                  </label>
                )}
                {renderInput(field)}
              </div>
            ))}
          </div>
        </div>
      )}

      {!!stage.checklists?.length && (
        <div className="ui-panel p-4 space-y-3">
          <h4 className="text-sm font-semibold text-brand">Checklist</h4>
          <div className="space-y-2">
            {stage.checklists.map((item) => (
              <div key={item.id} className="rounded-xl border border-neutral-200 px-3 py-3 space-y-2">
                <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                  {item.required !== false ? (
                    <RequiredStatusIcon submitted={Boolean(checklistValues[item.id]?.completed)} />
                  ) : null}
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
                  className="ui-field"
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
        </div>
      )}

      {canManage && (stage.fields?.length || stage.checklists?.length) ? (
        <div className="flex justify-end">
          <button type="button" className="ui-btn-primary" onClick={save}>
            Save section
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function WorkflowSectionsPanel({
  app,
  canManage,
  counsellors,
  activeTab,
  onTabChange,
  missingRequiredCount,
  handlers,
  onSaveWorkflowProgress,
  onSaved,
}) {
  const workflowTabs = useMemo(() => {
    const templateStages = app?.workflowTemplate?.stages || [];
    if (!templateStages.length) return fallbackTabs;
    return templateStages.map((stage) => ({
      key: stage.key,
      label: stage.label,
      icon: getWorkflowIcon(stage.iconKey),
      sectionType: stage.sectionType,
      stage,
    }));
  }, [app?.workflowTemplate?.stages]);

  const current = workflowTabs.find((tab) => tab.key === activeTab) || workflowTabs[0];

  const renderSection = () => {
    if (!current) return null;
    const stage = current.stage;
    switch (current.sectionType) {
      case 'STUDENT_INFO':
        return (
          <>
            <ApplicationMetaEditor app={app} counsellors={counsellors} canManage={canManage} onSave={handlers.onUpdateMeta} />
            <GenericWorkflowSection
              app={app}
              stage={stage}
              canManage={canManage}
              onSaveProgress={onSaveWorkflowProgress}
              onSaved={onSaved}
            />
          </>
        );
      case 'APPLICATION_PROCESS':
        return (
          <>
            <DocumentChecklist
              app={app}
              canManage={canManage}
              onStatus={handlers.onDocStatus}
              onApprove={handlers.onDocApprove}
              onReject={handlers.onDocReject}
              onDelete={handlers.onDocDelete}
              onAdd={handlers.onAddDoc}
              onUpload={handlers.onDocUpload}
              uploadingDocId={handlers.uploadingDocId}
              missingCount={missingRequiredCount}
              onNotifyMissing={handlers.onNotifyMissing}
            />
            <GenericWorkflowSection
              app={app}
              stage={stage}
              canManage={canManage}
              onSaveProgress={onSaveWorkflowProgress}
              onSaved={onSaved}
            />
          </>
        );
      case 'UNIVERSITY_APPLICATION':
      case 'SELECTION_OF_UNIVERSITY':
        return (
          <>
            <OfferLetterPanel
              app={app}
              canManage={canManage}
              onSave={handlers.onSaveOffer}
              onUpload={handlers.onOfferUpload}
              uploading={handlers.offerUploading}
            />
            <GenericWorkflowSection
              app={app}
              stage={stage}
              canManage={canManage}
              onSaveProgress={onSaveWorkflowProgress}
              onSaved={onSaved}
            />
          </>
        );
      case 'FINANCE_CALCULATOR':
        return (
          <>
            <ServiceFeesPanel
              app={app}
              stage={stage}
              canManage={canManage}
              onSaveProgress={onSaveWorkflowProgress}
              onSaved={onSaved}
            />
            <StaffApplicationFees app={app} canManage={canManage} onSaved={onSaved} />
          </>
        );
      case 'VISA_APPLICATION':
        return (
          <>
            <VisaPanel
              app={app}
              canManage={canManage}
              onSave={handlers.onSaveVisa}
              onUpload={handlers.onVisaUpload}
              onChecklistUpload={handlers.onVisaChecklistUpload}
              onAddDoc={handlers.onAddVisaDoc}
              onDocStatus={handlers.onVisaDocStatus}
              onDeleteDoc={handlers.onDeleteVisaDoc}
              uploading={handlers.visaUploading}
              uploadingDocId={handlers.visaUploadingDocId}
              workflow={handlers.visaWorkflow}
            />
            <GenericWorkflowSection
              app={app}
              stage={stage}
              canManage={canManage}
              onSaveProgress={onSaveWorkflowProgress}
              onSaved={onSaved}
            />
          </>
        );
      case 'LOGS_INFO':
        return <AuditTimeline app={app} />;
      case 'DISCUSSIONS':
        return (
          <ApplicationTasksPanel
            app={app}
            canManage={canManage}
            counsellors={counsellors}
            onCreate={handlers.onCreateTask}
            onUpdate={handlers.onUpdateTask}
            onDelete={handlers.onDeleteTask}
            busy={handlers.taskBusy}
          />
        );
      default:
        return (
          <GenericWorkflowSection
            app={app}
            stage={stage}
            canManage={canManage}
            onSaveProgress={onSaveWorkflowProgress}
            onSaved={onSaved}
          />
        );
    }
  };

  return (
    <div className="ui-surface">
      <div className="px-2 sm:px-4 border-b border-neutral-100">
        <nav role="tablist" className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {workflowTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const badge = tab.sectionType === 'APPLICATION_PROCESS' && missingRequiredCount > 0 ? missingRequiredCount : null;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`relative flex items-center gap-2 px-4 py-3 ui-text-strong whitespace-nowrap transition-all ${
                  isActive ? 'text-brand' : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-brand' : 'text-neutral-400'} />
                {tab.label}
                {badge != null && (
                  <span className="ml-0.5 px-1.5 py-px rounded-full bg-rose-100 text-rose-700 text-[10px] font-semibold">
                    {badge}
                  </span>
                )}
                <span className={`absolute left-3 right-3 -bottom-px h-[2px] rounded-full transition-all ${isActive ? 'bg-brand' : 'bg-transparent'}`} />
              </button>
            );
          })}
        </nav>
      </div>

      {!app?.workflowTemplate && (
        <div className="mx-5 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5" />
          This application is still using the fallback workflow view because no custom module template is attached.
        </div>
      )}

      <div className="p-5 sm:p-6 space-y-5 bg-neutral-50/40">{renderSection()}</div>
    </div>
  );
}
