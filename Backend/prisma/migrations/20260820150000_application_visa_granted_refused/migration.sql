-- Add Visa granted and Visa refused as application statuses.
ALTER TYPE "ApplicationStage" ADD VALUE IF NOT EXISTS 'VISA_GRANTED';
ALTER TYPE "ApplicationStage" ADD VALUE IF NOT EXISTS 'VISA_REFUSED';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name = 'ApplicationWorkflowFieldTemplate'
  ) THEN
    UPDATE "ApplicationWorkflowFieldTemplate"
    SET "optionsJson" = COALESCE("optionsJson", '[]'::jsonb) || '["Visa Granted", "Visa Refused"]'::jsonb
    WHERE "fieldKey" = 'application_status'
      AND NOT (
        COALESCE("optionsJson"::text, '') ILIKE '%Visa Granted%'
        AND COALESCE("optionsJson"::text, '') ILIKE '%Visa Refused%'
      );
  END IF;
END $$;
