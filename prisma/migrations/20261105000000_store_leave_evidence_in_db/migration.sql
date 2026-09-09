-- Medical evidence was previously written to local disk (process.cwd()/uploads/...),
-- which is read-only on the deployed (serverless) filesystem outside of /tmp -- every
-- upload attempt there threw, silently swallowed into a generic "check your dates"
-- error. Store the file bytes directly on the row instead, same pattern already used
-- for User.avatarImage.
ALTER TABLE "LOARequest" ADD COLUMN "medicalEvidenceData" BYTEA;
ALTER TABLE "LOARequest" ADD COLUMN "medicalEvidenceMimeType" TEXT;
