-- Restore living cost as a normal formula field (manual entry, included in result).
UPDATE "ApplicationWorkflowFieldTemplate" f
SET
  "placeholder" = 'Amount',
  "helpText" = 'Enter manually — included in result when filled',
  "updatedAt" = CURRENT_TIMESTAMP
FROM "ApplicationWorkflowStageTemplate" s
WHERE f."stageTemplateId" = s."id"
  AND s."sectionType" = 'FINANCE_CALCULATOR'
  AND f."fieldKey" = 'living_cost';
