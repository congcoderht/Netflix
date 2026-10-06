ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'COMMENT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SECURITY';

ALTER TABLE "notifications"
  ADD COLUMN "event_key" TEXT,
  ADD COLUMN "data" JSONB,
  ADD COLUMN "action_url" TEXT,
  ADD COLUMN "read_at" TIMESTAMP(3),
  ADD COLUMN "dedupe_key" TEXT,
  ADD COLUMN "expires_at" TIMESTAMP(3);

UPDATE "notifications"
SET
  "event_key" = CASE
    WHEN "type" = 'NEW_MOVIE' THEN 'moviePublished'
    WHEN "type" = 'SUBSCRIPTION' THEN 'subscriptionExpiring'
    ELSE 'systemAnnouncement'
  END,
  "data" = jsonb_build_object(
    'titleVi', "title",
    'titleEn', "title",
    'bodyVi', "body",
    'bodyEn', "body"
  ),
  "read_at" = CASE WHEN "is_read" THEN "created_at" ELSE NULL END;

ALTER TABLE "notifications" ALTER COLUMN "event_key" SET NOT NULL;
ALTER TABLE "notifications" DROP COLUMN "title";
ALTER TABLE "notifications" DROP COLUMN "body";
ALTER TABLE "notifications" DROP COLUMN "is_read";

CREATE UNIQUE INDEX "notifications_dedupe_key_key" ON "notifications"("dedupe_key");
CREATE INDEX "notifications_user_id_read_at_created_at_idx" ON "notifications"("user_id", "read_at", "created_at");
CREATE INDEX "notifications_expires_at_idx" ON "notifications"("expires_at");
