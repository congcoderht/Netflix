-- Existing refresh sessions are intentionally invalidated: plaintext tokens
-- cannot be migrated safely into a reusable token-family audit trail.
DELETE FROM "refresh_tokens";

ALTER TABLE "refresh_tokens"
  DROP COLUMN "token",
  ADD COLUMN "token_hash" TEXT NOT NULL,
  ADD COLUMN "family_id" TEXT NOT NULL,
  ADD COLUMN "replaced_by_token_hash" TEXT,
  ADD COLUMN "used_at" TIMESTAMP(3),
  ADD COLUMN "revoked_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");
CREATE INDEX "refresh_tokens_user_id_revoked_at_idx" ON "refresh_tokens"("user_id", "revoked_at");
