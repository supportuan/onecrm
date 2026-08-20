-- Steps 9 & 10: distinct icons (GraduationCap, NotebookPen).
UPDATE "ApplicationWorkflowStageTemplate"
SET
  "iconKey" = 'GraduationCap',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "sectionType" = 'ENROLMENT_CONFIRMATION'
  AND ("iconKey" IS NULL OR "iconKey" IN ('BadgeCheck', 'CheckCircle2'));

UPDATE "ApplicationWorkflowStageTemplate"
SET
  "iconKey" = 'NotebookPen',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "sectionType" = 'DISCUSSIONS'
  AND ("iconKey" IS NULL OR "iconKey" = 'MessageSquare');
