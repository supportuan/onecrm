-- Student preferred university/course from catalog
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "preferredUniversityId" INTEGER;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "preferredCourseId" INTEGER;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "preferredCourse" TEXT;

DO $$ BEGIN
  ALTER TABLE "Student" ADD CONSTRAINT "Student_preferredUniversityId_fkey"
    FOREIGN KEY ("preferredUniversityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Student" ADD CONSTRAINT "Student_preferredCourseId_fkey"
    FOREIGN KEY ("preferredCourseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
