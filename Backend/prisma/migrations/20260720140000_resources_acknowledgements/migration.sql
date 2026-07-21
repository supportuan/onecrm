-- Resources library with per-user acknowledgements
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "requiresAcknowledgement" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "targetRoles" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "fileName" TEXT;
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "mimeType" TEXT;
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "fileSize" INTEGER;
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "uploadedById" INTEGER;
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "Resource_tenantId_deletedAt_idx" ON "Resource"("tenantId", "deletedAt");
CREATE INDEX IF NOT EXISTS "Resource_isPublished_deletedAt_idx" ON "Resource"("isPublished", "deletedAt");

ALTER TABLE "Resource"
  ADD CONSTRAINT "Resource_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Resource"
  ADD CONSTRAINT "Resource_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ResourceAcknowledgement" (
  "id" SERIAL NOT NULL,
  "resourceId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ResourceAcknowledgement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ResourceAcknowledgement_resourceId_userId_key"
  ON "ResourceAcknowledgement"("resourceId", "userId");
CREATE INDEX IF NOT EXISTS "ResourceAcknowledgement_userId_idx"
  ON "ResourceAcknowledgement"("userId");

ALTER TABLE "ResourceAcknowledgement"
  ADD CONSTRAINT "ResourceAcknowledgement_resourceId_fkey"
  FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ResourceAcknowledgement"
  ADD CONSTRAINT "ResourceAcknowledgement_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
