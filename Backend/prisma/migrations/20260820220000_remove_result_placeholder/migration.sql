UPDATE "ApplicationWorkflowFieldTemplate" f
SET
  "placeholder" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
FROM "ApplicationWorkflowStageTemplate" s
WHERE f."stageTemplateId" = s."id"
  AND s."sectionType" = 'FINANCE_CALCULATOR'
  AND f."fieldKey" = 'total_funds_required'
  AND f."placeholder" = 'Auto-calculated';
