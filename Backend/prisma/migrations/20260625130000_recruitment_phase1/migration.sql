-- Recruitment Phase 1
--   * Offer letter templates (tenant-configurable, with variable substitution)
--   * Offer-letter additions: templateId, renderedHtml snapshot, conditional flag,
--     acceptedAt/rejectedAt timestamps, employeeId link (set when ACCEPTED auto-
--     creates an employee row).
--   * Onboarding templates (reusable playbooks) + dueDate / assignee on each
--     spawned checklist item.
--   * Candidate stage audit log.

SET search_path TO "onecrm", public;

-- ---------------------------------------------------------------------------
-- HrOfferLetter: new columns
-- ---------------------------------------------------------------------------
ALTER TABLE "HrOfferLetter"
  ADD COLUMN IF NOT EXISTS "templateId"   INTEGER,
  ADD COLUMN IF NOT EXISTS "renderedHtml" TEXT,
  ADD COLUMN IF NOT EXISTS "conditional"  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "acceptedAt"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectedAt"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "employeeId"   INTEGER;

-- ---------------------------------------------------------------------------
-- HrOnboardingItem: new columns
-- ---------------------------------------------------------------------------
ALTER TABLE "HrOnboardingItem"
  ADD COLUMN IF NOT EXISTS "dueDate"  TEXT,
  ADD COLUMN IF NOT EXISTS "assignee" TEXT;

-- ---------------------------------------------------------------------------
-- HrOfferLetterTemplate
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "HrOfferLetterTemplate" (
  "id"          SERIAL PRIMARY KEY,
  "tenantId"    INTEGER,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "bodyHtml"    TEXT NOT NULL,
  "isDefault"   BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "HrOfferLetterTemplate_tenantId_idx"
  ON "HrOfferLetterTemplate"("tenantId");

ALTER TABLE "HrOfferLetterTemplate"
  ADD CONSTRAINT "HrOfferLetterTemplate_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "HrOfferLetter"
  ADD CONSTRAINT "HrOfferLetter_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "HrOfferLetterTemplate"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- HrOnboardingTemplate + items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "HrOnboardingTemplate" (
  "id"          SERIAL PRIMARY KEY,
  "tenantId"    INTEGER,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "isDefault"   BOOLEAN NOT NULL DEFAULT FALSE,
  "role"        TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "HrOnboardingTemplate_tenantId_idx"
  ON "HrOnboardingTemplate"("tenantId");

ALTER TABLE "HrOnboardingTemplate"
  ADD CONSTRAINT "HrOnboardingTemplate_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE NO ACTION ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "HrOnboardingTemplateItem" (
  "id"            SERIAL PRIMARY KEY,
  "templateId"    INTEGER NOT NULL,
  "category"      "HrOnboardingCategory" NOT NULL,
  "title"         TEXT NOT NULL,
  "description"   TEXT,
  "dueOffsetDays" INTEGER NOT NULL DEFAULT 0,
  "assigneeRole"  TEXT,
  "sortOrder"     INTEGER NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "HrOnboardingTemplateItem_templateId_idx"
  ON "HrOnboardingTemplateItem"("templateId");

ALTER TABLE "HrOnboardingTemplateItem"
  ADD CONSTRAINT "HrOnboardingTemplateItem_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "HrOnboardingTemplate"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- HrCandidateStageEvent
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "HrCandidateStageEvent" (
  "id"          SERIAL PRIMARY KEY,
  "candidateId" INTEGER NOT NULL,
  "fromStage"   TEXT,
  "toStage"     TEXT NOT NULL,
  "changedById" INTEGER,
  "notes"       TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "HrCandidateStageEvent_candidateId_idx"
  ON "HrCandidateStageEvent"("candidateId");

ALTER TABLE "HrCandidateStageEvent"
  ADD CONSTRAINT "HrCandidateStageEvent_candidateId_fkey"
  FOREIGN KEY ("candidateId") REFERENCES "HrCandidate"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HrCandidateStageEvent"
  ADD CONSTRAINT "HrCandidateStageEvent_changedById_fkey"
  FOREIGN KEY ("changedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Seed: one global default offer letter template and one default onboarding
-- template (tenantId = NULL means "available to every tenant"). Tenants can
-- override by creating their own with isDefault = TRUE.
-- ---------------------------------------------------------------------------
INSERT INTO "HrOfferLetterTemplate" ("tenantId", "name", "description", "bodyHtml", "isDefault")
SELECT NULL,
       'Standard Offer Letter',
       'Default offer letter — edit or duplicate before sending.',
       '<h1>Offer of Employment</h1>
<p>Date: {{today}}</p>
<p>Dear {{candidateName}},</p>
<p>We are delighted to extend an offer of employment for the position of <strong>{{jobTitle}}</strong> in our {{department}} team at {{companyName}}.</p>
<h3>Compensation</h3>
<p>Your annual compensation will be <strong>{{offeredSalary}}</strong>, paid in accordance with company policy.</p>
<h3>Joining details</h3>
<ul>
  <li>Joining date: <strong>{{joiningDate}}</strong></li>
  <li>This offer is valid until <strong>{{expiryDate}}</strong>.</li>
  <li>{{conditionalClause}}</li>
</ul>
<h3>Confidentiality &amp; policy</h3>
<p>By accepting this offer, you agree to abide by all company policies, including confidentiality, data protection, and the code of conduct as published on our internal portal.</p>
<p>We look forward to welcoming you to the team.</p>
<p>Sincerely,<br/>{{companyName}} HR</p>',
       TRUE
WHERE NOT EXISTS (SELECT 1 FROM "HrOfferLetterTemplate" WHERE "tenantId" IS NULL AND "isDefault" = TRUE);

INSERT INTO "HrOnboardingTemplate" ("tenantId", "name", "description", "isDefault")
SELECT NULL, 'Standard Onboarding', 'Default 30-day onboarding playbook — duplicate to customise per role.', TRUE
WHERE NOT EXISTS (SELECT 1 FROM "HrOnboardingTemplate" WHERE "tenantId" IS NULL AND "isDefault" = TRUE);

INSERT INTO "HrOnboardingTemplateItem" ("templateId", "category", "title", "description", "dueOffsetDays", "assigneeRole", "sortOrder")
SELECT t.id, cat::"HrOnboardingCategory", title, descr, due, assignee_role, ord
FROM "HrOnboardingTemplate" t,
     (VALUES
       ('DOCUMENTS', 'Signed offer letter',          'Collect and file the signed offer letter.',     0,  'HR',      1),
       ('DOCUMENTS', 'Identity proof',               'Govt. ID + address proof for personnel file.',  3,  'HR',      2),
       ('DOCUMENTS', 'Bank details form',            'Required before first payroll run.',            5,  'HR',      3),
       ('ACCESS',    'Email account provisioning',   'Create corporate email and shared drives.',     0,  'IT',      4),
       ('ACCESS',    'HRMS access',                  'Grant access to HRMS, payslips, and leave.',    2,  'IT',      5),
       ('ACCESS',    'Laptop + peripherals',         'Issue laptop and required peripherals.',        0,  'IT',      6),
       ('TRAINING',  'Orientation session',          'Company overview, structure, values.',          1,  'HR',      7),
       ('TRAINING',  'Code of conduct training',     'Compliance & ethics module.',                   7,  'HR',      8),
       ('TRAINING',  'Role-specific training',       'Coordinated by the hiring manager.',            14, 'MANAGER', 9)
     ) AS v(cat, title, descr, due, assignee_role, ord)
WHERE t."tenantId" IS NULL AND t."isDefault" = TRUE
  AND NOT EXISTS (SELECT 1 FROM "HrOnboardingTemplateItem" WHERE "templateId" = t.id);
