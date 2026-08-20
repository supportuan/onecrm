-- Add service fee fields and a manual verification checkbox to existing Service fees stages.
UPDATE "ApplicationWorkflowFieldTemplate" f
SET
  "required" = TRUE,
  "updatedAt" = CURRENT_TIMESTAMP
FROM "ApplicationWorkflowStageTemplate" s
WHERE f."stageTemplateId" = s."id"
  AND s."sectionType" = 'FINANCE_CALCULATOR'
  AND f."fieldKey" IN (
    'tuition_fees',
    'deposits',
    'remaining_fee',
    'living_cost',
    'total_funds_required',
    'service_fees_verified'
  );

INSERT INTO "ApplicationWorkflowFieldTemplate" (
  "stageTemplateId",
  "fieldKey",
  "label",
  "fieldType",
  "required",
  "placeholder",
  "helpText",
  "optionsJson",
  "sortOrder",
  "createdAt",
  "updatedAt"
)
SELECT
  s."id",
  f.field_key,
  f.label,
  f.field_type::"WorkflowFieldType",
  f.required,
  f.placeholder,
  f.help_text,
  NULL::jsonb,
  COALESCE((
    SELECT MAX(existing."sortOrder")
    FROM "ApplicationWorkflowFieldTemplate" existing
    WHERE existing."stageTemplateId" = s."id"
  ), -1) + f.ord,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "ApplicationWorkflowStageTemplate" s
CROSS JOIN (
  VALUES
    ('tuition_fees', 'Tuition fees', 'CURRENCY', TRUE, 'Amount', NULL, 1),
    ('deposits', 'Deposits', 'CURRENCY', TRUE, 'Amount', NULL, 2),
    ('remaining_fee', 'Remaining fee', 'CURRENCY', TRUE, 'Amount', NULL, 3),
    ('living_cost', 'Living cost', 'CURRENCY', TRUE, 'Amount', NULL, 4),
    ('total_funds_required', 'Total funds Required', 'CURRENCY', TRUE, 'Amount', NULL, 5),
    ('service_fees_verified', 'Verified', 'CHECKBOX', TRUE, NULL, 'Staff must confirm these figures before this step turns green', 6)
) AS f(field_key, label, field_type, required, placeholder, help_text, ord)
WHERE s."sectionType" = 'FINANCE_CALCULATOR'
  AND NOT EXISTS (
    SELECT 1
    FROM "ApplicationWorkflowFieldTemplate" existing
    WHERE existing."stageTemplateId" = s."id"
      AND existing."fieldKey" = f.field_key
  );
