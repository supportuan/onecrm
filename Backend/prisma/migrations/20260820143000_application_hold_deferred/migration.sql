-- Add On Hold and Deferred as application statuses.
ALTER TYPE "ApplicationStage" ADD VALUE IF NOT EXISTS 'ON_HOLD';
ALTER TYPE "ApplicationStage" ADD VALUE IF NOT EXISTS 'DEFERRED';

-- Keep existing university-application status dropdowns in sync.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name = 'ApplicationWorkflowFieldTemplate'
  ) THEN
    UPDATE "ApplicationWorkflowFieldTemplate"
    SET "optionsJson" = COALESCE("optionsJson", '[]'::jsonb) || '["On Hold", "Deferred"]'::jsonb
    WHERE "fieldKey" = 'application_status'
      AND NOT (
        COALESCE("optionsJson"::text, '') ILIKE '%On Hold%'
        AND COALESCE("optionsJson"::text, '') ILIKE '%Deferred%'
      );
  END IF;
END $$;
