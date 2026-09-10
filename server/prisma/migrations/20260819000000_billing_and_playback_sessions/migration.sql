ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';

ALTER TABLE "plans"
  ADD COLUMN "code" TEXT,
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'VND',
  ADD COLUMN "duration_days" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

UPDATE "plans"
SET "code" = UPPER(REGEXP_REPLACE("name", '[^A-Za-z0-9]+', '_', 'g'));

ALTER TABLE "plans" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");
ALTER TABLE "plans" ALTER COLUMN "price" TYPE INTEGER USING ROUND("price")::INTEGER;

ALTER TABLE "payments"
  ADD COLUMN "subscription_id" TEXT,
  ADD COLUMN "order_id" TEXT,
  ADD COLUMN "request_id" TEXT,
  ADD COLUMN "provider_transaction_id" TEXT,
  ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'MOMO',
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'VND',
  ADD COLUMN "plan_name" TEXT,
  ADD COLUMN "duration_days" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "failure_code" TEXT,
  ADD COLUMN "failure_message" TEXT,
  ADD COLUMN "payment_url" TEXT,
  ADD COLUMN "expires_at" TIMESTAMP(3),
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "payments" p
SET "order_id" = 'legacy-' || p."id",
    "request_id" = 'legacy-' || p."id",
    "plan_name" = pl."name",
    "expires_at" = p."created_at" + INTERVAL '30 minutes'
FROM "plans" pl
WHERE p."plan_id" = pl."id";

ALTER TABLE "payments"
  ALTER COLUMN "order_id" SET NOT NULL,
  ALTER COLUMN "request_id" SET NOT NULL,
  ALTER COLUMN "plan_name" SET NOT NULL,
  ALTER COLUMN "expires_at" SET NOT NULL,
  ALTER COLUMN "amount" TYPE INTEGER USING ROUND("amount")::INTEGER;

CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");
CREATE UNIQUE INDEX "payments_request_id_key" ON "payments"("request_id");
CREATE UNIQUE INDEX "payments_provider_transaction_id_key" ON "payments"("provider_transaction_id");
CREATE INDEX "payments_user_id_created_at_idx" ON "payments"("user_id", "created_at");
CREATE INDEX "payments_status_idx" ON "payments"("status");
CREATE INDEX "subscriptions_user_id_status_expires_at_idx" ON "subscriptions"("user_id", "status", "expires_at");

ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey"
  FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "playback_sessions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "device_id" TEXT NOT NULL,
  "movie_id" TEXT NOT NULL,
  "episode_id" TEXT,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_heartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ended_at" TIMESTAMP(3),
  CONSTRAINT "playback_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "playback_sessions_user_id_ended_at_last_heartbeat_idx"
  ON "playback_sessions"("user_id", "ended_at", "last_heartbeat");
CREATE INDEX "playback_sessions_device_id_idx" ON "playback_sessions"("device_id");
ALTER TABLE "playback_sessions" ADD CONSTRAINT "playback_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
