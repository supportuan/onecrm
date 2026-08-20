'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  computeServiceFeeTotal,
  getServiceFeeEffect,
  isTemplateFieldSubmitted,
  SERVICE_FEE_EFFECT,
  SERVICE_FEE_FORMULA_LABEL,
} from '../workflowTemplateUi';
import RequiredStatusIcon from './RequiredStatusIcon';

const FIELD_ORDER = ['tuition_fees', 'deposits', 'remaining_fee', 'living_cost', 'total_funds_required'];

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-brand focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-500';
const panelClass = 'rounded-2xl border border-neutral-200 bg-white p-4 space-y-3';
const labelClass = 'text-[11px] font-medium uppercase tracking-wide text-neutral-500';

const parseAmount = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatAmount = (value) => {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const sortServiceFeeFields = (fields = []) =>
  [...fields].sort((a, b) => {
    const aIndex = FIELD_ORDER.indexOf(a.fieldKey);
    const bIndex = FIELD_ORDER.indexOf(b.fieldKey);
    const left = aIndex === -1 ? FIELD_ORDER.length : aIndex;
    const right = bIndex === -1 ? FIELD_ORDER.length : bIndex;
    if (left !== right) return left - right;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });

function FieldRow({ label, required, filled, children, helpText }) {
  return (
    <div className="space-y-1.5">
      <label className={`${labelClass} inline-flex items-center gap-1.5`}>
        {required ? <RequiredStatusIcon submitted={filled} /> : null}
        {label}
      </label>
      {children}
      {helpText ? <p className="text-[11px] text-neutral-500">{helpText}</p> : null}
    </div>
  );
}

export default function ServiceFeesPanel({ app, stage, canManage, onSaveProgress, onSaved, variant = 'detail' }) {
  const isDetail = variant === 'detail';

  const valueMap = useMemo(
    () => Object.fromEntries((app?.workflowFieldValues || []).map((item) => [item.fieldTemplateId, item.valueJson])),
    [app?.workflowFieldValues]
  );

  const fieldsByKey = useMemo(
    () => Object.fromEntries((stage?.fields || []).map((field) => [field.fieldKey, field])),
    [stage?.fields]
  );

  const totalField = fieldsByKey.total_funds_required;
  const verifiedField = fieldsByKey.service_fees_verified;

  const inputFields = useMemo(
    () =>
      sortServiceFeeFields(
        (stage?.fields || []).filter(
          (field) =>
            field.fieldType === 'CURRENCY' && getServiceFeeEffect(field) !== SERVICE_FEE_EFFECT.TOTAL
        )
      ),
    [stage?.fields]
  );

  const [fieldValues, setFieldValues] = useState({});

  useEffect(() => {
    const next = {};
    (stage?.fields || []).forEach((field) => {
      const raw = valueMap[field.id];
      next[field.id] = field.fieldType === 'CHECKBOX' ? Boolean(raw) : raw ?? '';
    });
    setFieldValues(next);
  }, [stage?.fields, valueMap]);

  const computedTotal = useMemo(
    () => computeServiceFeeTotal(fieldValues, stage?.fields || []),
    [fieldValues, stage?.fields]
  );

  useEffect(() => {
    if (!totalField) return;
    const nextTotal = String(computedTotal);
    setFieldValues((prev) => {
      if (prev[totalField.id] === nextTotal) return prev;
      return { ...prev, [totalField.id]: nextTotal };
    });
  }, [computedTotal, totalField]);

  const save = async () => {
    if (!onSaveProgress) return;
    const payload = { ...(fieldValues || {}) };
    if (totalField) payload[totalField.id] = String(computedTotal);
    await onSaveProgress({
      fieldValues: Object.entries(payload).map(([fieldTemplateId, valueJson]) => ({
        fieldTemplateId: Number(fieldTemplateId),
        valueJson,
      })),
    });
    onSaved?.();
  };

  const updateField = (fieldId, value) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  if (!inputFields.length && !totalField && !verifiedField) {
    return <p className="text-sm text-neutral-500">No service fee fields configured for this step yet.</p>;
  }

  const totalFees = parseAmount(fieldValues[fieldsByKey.tuition_fees?.id]);
  const deposit = parseAmount(fieldValues[fieldsByKey.deposits?.id]);
  const remaining = parseAmount(fieldValues[fieldsByKey.remaining_fee?.id]);
  const living = parseAmount(fieldValues[fieldsByKey.living_cost?.id]);
  const hasFormulaFields = Boolean(fieldsByKey.tuition_fees && fieldsByKey.deposits);

  return (
    <div className="space-y-4">
      <div className={isDetail ? panelClass : 'ui-panel p-4 space-y-4'}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-brand">Service fees</h4>
            <p className="mt-0.5 text-xs text-neutral-500">{SERVICE_FEE_FORMULA_LABEL}</p>
          </div>
          {canManage && onSaveProgress ? (
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
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {inputFields.map((field) => (
            <FieldRow
              key={field.id}
              label={field.label}
              required={Boolean(field.required)}
              filled={isTemplateFieldSubmitted(field, fieldValues, stage)}
              helpText={field.helpText}
            >
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                value={fieldValues[field.id] ?? ''}
                disabled={!canManage}
                placeholder={field.placeholder || 'Amount'}
                onChange={(e) => updateField(field.id, e.target.value)}
              />
            </FieldRow>
          ))}

          {totalField ? (
            <FieldRow
              label={totalField.label}
              required={Boolean(totalField.required)}
              filled={isTemplateFieldSubmitted(totalField, fieldValues, stage)}
              helpText={totalField.helpText || undefined}
            >
              <input
                type="text"
                readOnly
                className={`${inputClass} bg-neutral-50 font-semibold text-brand`}
                value={formatAmount(computedTotal)}
              />
            </FieldRow>
          ) : null}
        </div>

        {hasFormulaFields ? (
          <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
            {formatAmount(totalFees)} − {formatAmount(deposit)} + {formatAmount(remaining)} + {formatAmount(living)} ={' '}
            <span className="font-semibold text-brand">{formatAmount(computedTotal)}</span>
          </p>
        ) : null}

        {verifiedField ? (
          <label className="inline-flex items-start gap-2 rounded-xl border border-neutral-200 bg-neutral-50/70 px-3 py-3 text-sm text-neutral-700">
            <RequiredStatusIcon submitted={isTemplateFieldSubmitted(verifiedField, fieldValues, stage)} />
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 accent-brand"
              checked={Boolean(fieldValues[verifiedField.id])}
              disabled={!canManage}
              onChange={(e) => updateField(verifiedField.id, e.target.checked)}
            />
            <span>
              <span className="font-medium text-brand">{verifiedField.label}</span>
              {verifiedField.helpText ? (
                <span className="mt-0.5 block text-xs text-neutral-500">{verifiedField.helpText}</span>
              ) : null}
            </span>
          </label>
        ) : null}
      </div>
    </div>
  );
}
