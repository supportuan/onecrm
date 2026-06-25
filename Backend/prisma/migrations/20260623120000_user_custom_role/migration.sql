-- Custom role label + permission lookup key for tenant-defined roles
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "roleLabel" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "permissionRole" TEXT;

CREATE INDEX IF NOT EXISTS "User_permissionRole_idx" ON "User"("permissionRole");
