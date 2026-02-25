-- Add TIMETABLE to ImportJobType enum
ALTER TYPE "ImportJobType" ADD VALUE IF NOT EXISTS 'TIMETABLE';

-- Add new optional fields to TimetableEntry
ALTER TABLE "TimetableEntry"
  ADD COLUMN IF NOT EXISTS "weekPattern" TEXT,
  ADD COLUMN IF NOT EXISTS "startTime"   TEXT,
  ADD COLUMN IF NOT EXISTS "endTime"     TEXT,
  ADD COLUMN IF NOT EXISTS "slotKey"     TEXT;

-- Add unique constraint on (tenantId, classCode, slotKey)
-- NULL values are treated as distinct in PostgreSQL so rows with NULL slotKey are always allowed
CREATE UNIQUE INDEX IF NOT EXISTS "TimetableEntry_tenantId_classCode_slotKey_key"
  ON "TimetableEntry"("tenantId", "classCode", "slotKey");

-- Add conflictsJson to TimetableImportJob
ALTER TABLE "TimetableImportJob"
  ADD COLUMN IF NOT EXISTS "conflictsJson" JSONB;
