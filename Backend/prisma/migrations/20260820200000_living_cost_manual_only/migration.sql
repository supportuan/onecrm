-- Living cost is manual entry only; remove formula hints that implied auto-calculation.
UPDATE "ApplicationWorkflowFieldTemplate" f
SET
  "placeholder" = 'Enter manually',
  "helpText" = 'Manual entry only — not included in the auto-calculated result',
  "metadata" = COALESCE(f."metadata", '{}'::jsonb) || '{"manualOnly":true}'::jsonb,
  "updatedAt" = CURRENT_TIMESTAMP
FROM "ApplicationWorkflowStageTemplate" s
WHERE f."stageTemplateId" = s."id"
  AND s."sectionType" = 'FINANCE_CALCULATOR'
  AND f."fieldKey" = 'living_cost';
