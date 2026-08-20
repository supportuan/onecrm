-- Tag service fee fields as add, deduct, or auto-calculated total.
UPDATE "ApplicationWorkflowFieldTemplate" f
SET
  "metadata" = CASE f."fieldKey"
    WHEN 'tuition_fees' THEN '{"feeEffect":"add"}'::jsonb
    WHEN 'living_cost' THEN '{"feeEffect":"add"}'::jsonb
    WHEN 'remaining_fee' THEN '{"feeEffect":"add"}'::jsonb
    WHEN 'deposits' THEN '{"feeEffect":"deduct"}'::jsonb
    WHEN 'total_funds_required' THEN '{"feeEffect":"total"}'::jsonb
    ELSE f."metadata"
  END,
  "label" = CASE f."fieldKey"
    WHEN 'deposits' THEN 'Deposits paid'
    WHEN 'total_funds_required' THEN 'Total funds required'
    ELSE f."label"
  END,
  "placeholder" = CASE f."fieldKey"
    WHEN 'total_funds_required' THEN 'Auto-calculated'
    ELSE f."placeholder"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
FROM "ApplicationWorkflowStageTemplate" s
WHERE f."stageTemplateId" = s."id"
  AND s."sectionType" = 'FINANCE_CALCULATOR'
  AND f."fieldKey" IN (
    'tuition_fees',
    'living_cost',
    'remaining_fee',
    'deposits',
    'total_funds_required'
  );
