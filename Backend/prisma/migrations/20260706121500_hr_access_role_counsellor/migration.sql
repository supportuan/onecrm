-- Add counsellor as an HR access role
ALTER TYPE "HrAccessRole" ADD VALUE IF NOT EXISTS 'COUNSELLOR';
