ALTER TABLE "comments" ADD COLUMN "reply_to_id" TEXT;

-- Existing replies were all direct replies to their thread root.
UPDATE "comments"
SET "reply_to_id" = "parent_id"
WHERE "parent_id" IS NOT NULL;

CREATE INDEX "comments_reply_to_id_idx" ON "comments"("reply_to_id");

ALTER TABLE "comments"
ADD CONSTRAINT "comments_reply_to_id_fkey"
FOREIGN KEY ("reply_to_id") REFERENCES "comments"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
