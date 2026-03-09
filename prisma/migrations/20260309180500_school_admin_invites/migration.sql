-- School admin invites + acceptance tokens

CREATE TABLE IF NOT EXISTS "SchoolAdminInvite" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "invitedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SchoolAdminInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SchoolAdminInvite_tokenHash_key" ON "SchoolAdminInvite"("tokenHash");
CREATE INDEX IF NOT EXISTS "SchoolAdminInvite_tenantId_email_idx" ON "SchoolAdminInvite"("tenantId", "email");

DO $$ BEGIN
  ALTER TABLE "SchoolAdminInvite"
    ADD CONSTRAINT "SchoolAdminInvite_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "SchoolAdminInvite"
    ADD CONSTRAINT "SchoolAdminInvite_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
