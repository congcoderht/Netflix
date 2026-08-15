DELETE FROM "ratings" WHERE "score" < 1 OR "score" > 5;

ALTER TABLE "ratings"
ADD CONSTRAINT "ratings_score_check" CHECK ("score" BETWEEN 1 AND 5);

CREATE INDEX "comments_movie_id_created_at_idx" ON "comments"("movie_id", "created_at");
CREATE INDEX "comments_parent_id_idx" ON "comments"("parent_id");
CREATE INDEX "ratings_movie_id_idx" ON "ratings"("movie_id");
