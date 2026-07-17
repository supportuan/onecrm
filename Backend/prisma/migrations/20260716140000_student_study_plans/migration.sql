-- Student study plan entries (destination + university + course groupings)

CREATE TABLE "StudentStudyPlan" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "countryId" INTEGER,
    "country" TEXT,
    "universityId" INTEGER,
    "university" TEXT,
    "courseId" INTEGER,
    "course" TEXT,
    "intake" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentStudyPlan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StudentStudyPlan_studentId_idx" ON "StudentStudyPlan"("studentId");

ALTER TABLE "StudentStudyPlan" ADD CONSTRAINT "StudentStudyPlan_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentStudyPlan" ADD CONSTRAINT "StudentStudyPlan_countryId_fkey"
    FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentStudyPlan" ADD CONSTRAINT "StudentStudyPlan_universityId_fkey"
    FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentStudyPlan" ADD CONSTRAINT "StudentStudyPlan_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "studyPlanId" INTEGER;
CREATE INDEX IF NOT EXISTS "Application_studyPlanId_idx" ON "Application"("studyPlanId");
ALTER TABLE "Application" ADD CONSTRAINT "Application_studyPlanId_fkey"
    FOREIGN KEY ("studyPlanId") REFERENCES "StudentStudyPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
