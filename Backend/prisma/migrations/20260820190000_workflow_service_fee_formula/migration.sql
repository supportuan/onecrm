-- Align service fee labels and formula roles: Total fees − Deposit + Remaining + Living = Result
UPDATE "ApplicationWorkflowFieldTemplate" f
SET
  "metadata" = CASE f."fieldKey"
    WHEN 'tuition_fees' THEN '{"feeEffect":"base"}'::jsonb
    WHEN 'deposits' THEN '{"feeEffect":"deduct"}'::jsonb
    WHEN 'remaining_fee' THEN '{"feeEffect":"add"}'::jsonb
    WHEN 'living_cost' THEN '{"feeEffect":"add"}'::jsonb
    WHEN 'total_funds_required' THEN '{"feeEffect":"total"}'::jsonb
    ELSE f."metadata"
  END,
  "label" = CASE f."fieldKey"
    WHEN 'tuition_fees' THEN 'Total fees'
    WHEN 'deposits' THEN 'Deposit'
    WHEN 'remaining_fee' THEN 'Remaining fees'
    WHEN 'total_funds_required' THEN 'Result'
    ELSE f."label"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
FROM "ApplicationWorkflowStageTemplate" s
WHERE f."stageTemplateId" = s."id"
  AND s."sectionType" = 'FINANCE_CALCULATOR'
  AND f."fieldKey" IN (
    'tuition_fees',
    'deposits',
    'remaining_fee',
    'living_cost',
    'total_funds_required'
  );
