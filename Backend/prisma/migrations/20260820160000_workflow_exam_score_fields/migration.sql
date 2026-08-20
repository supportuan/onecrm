-- Add exam score fields to existing Students info workflow stages.
INSERT INTO "ApplicationWorkflowFieldTemplate" (
  "stageTemplateId",
  "fieldKey",
  "label",
  "fieldType",
  "required",
  "placeholder",
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
  f.options_json,
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
    ('ielts_score', 'IELTS', 'NUMBER', TRUE, 'Score', NULL::jsonb, 1),
    ('toefl_score', 'TOEFL', 'NUMBER', TRUE, 'Score', NULL::jsonb, 2),
    ('gre_score', 'GRE', 'NUMBER', TRUE, 'Score', NULL::jsonb, 3),
    ('gmat_score', 'GMAT', 'NUMBER', TRUE, 'Score', NULL::jsonb, 4),
    ('exam_name', 'Exam', 'SELECT', TRUE, NULL, '["IELTS","TOEFL","PTE","GRE","GMAT","Duolingo","Other"]'::jsonb, 5),
    ('exam_overall', 'Overall', 'NUMBER', TRUE, 'Overall score', NULL::jsonb, 6),
    ('exam_reading', 'Reading', 'NUMBER', TRUE, NULL, NULL::jsonb, 7),
    ('exam_writing', 'Writing', 'NUMBER', TRUE, NULL, NULL::jsonb, 8),
    ('exam_speaking', 'Speaking', 'NUMBER', TRUE, NULL, NULL::jsonb, 9),
    ('exam_listening', 'Listening', 'NUMBER', TRUE, NULL, NULL::jsonb, 10)
) AS f(field_key, label, field_type, required, placeholder, options_json, ord)
WHERE s."sectionType" = 'STUDENT_INFO'
  AND NOT EXISTS (
    SELECT 1
    FROM "ApplicationWorkflowFieldTemplate" existing
    WHERE existing."stageTemplateId" = s."id"
      AND existing."fieldKey" = f.field_key
  );
