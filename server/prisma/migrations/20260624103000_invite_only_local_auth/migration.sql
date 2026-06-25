CREATE TYPE "AuthTokenPurpose" AS ENUM ('PASSWORD_RESET');

ALTER TABLE "User"
  ALTER COLUMN "authProvider" SET DEFAULT 'local',
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil" TIMESTAMP(3);

CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_status_idx" ON "User"("status");

CREATE TABLE "RefreshSession" (
  "sessionId" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "replacedBySessionId" TEXT,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("sessionId")
);

CREATE UNIQUE INDEX "RefreshSession_tokenHash_key" ON "RefreshSession"("tokenHash");
CREATE INDEX "RefreshSession_userId_idx" ON "RefreshSession"("userId");
CREATE INDEX "RefreshSession_expiresAt_idx" ON "RefreshSession"("expiresAt");
CREATE INDEX "RefreshSession_revokedAt_idx" ON "RefreshSession"("revokedAt");

ALTER TABLE "RefreshSession"
  ADD CONSTRAINT "RefreshSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("userId")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "InviteToken" (
  "inviteId" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdById" TEXT,
  "acceptedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InviteToken_pkey" PRIMARY KEY ("inviteId")
);

CREATE UNIQUE INDEX "InviteToken_tokenHash_key" ON "InviteToken"("tokenHash");
CREATE INDEX "InviteToken_email_idx" ON "InviteToken"("email");
CREATE INDEX "InviteToken_expiresAt_idx" ON "InviteToken"("expiresAt");
CREATE INDEX "InviteToken_acceptedAt_idx" ON "InviteToken"("acceptedAt");
CREATE INDEX "InviteToken_revokedAt_idx" ON "InviteToken"("revokedAt");

ALTER TABLE "InviteToken"
  ADD CONSTRAINT "InviteToken_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("userId")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InviteToken"
  ADD CONSTRAINT "InviteToken_acceptedById_fkey"
  FOREIGN KEY ("acceptedById") REFERENCES "User"("userId")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "AuthToken" (
  "authTokenId" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "purpose" "AuthTokenPurpose" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("authTokenId")
);

CREATE UNIQUE INDEX "AuthToken_tokenHash_key" ON "AuthToken"("tokenHash");
CREATE INDEX "AuthToken_userId_purpose_idx" ON "AuthToken"("userId", "purpose");
CREATE INDEX "AuthToken_expiresAt_idx" ON "AuthToken"("expiresAt");
CREATE INDEX "AuthToken_usedAt_idx" ON "AuthToken"("usedAt");

ALTER TABLE "AuthToken"
  ADD CONSTRAINT "AuthToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("userId")
  ON DELETE CASCADE ON UPDATE CASCADE;
