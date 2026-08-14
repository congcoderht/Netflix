-- PostgreSQL treats NULL values as distinct in a regular unique constraint.
-- This partial index guarantees one progress row per user/movie for films,
-- where episode_id is intentionally NULL.
CREATE UNIQUE INDEX "watch_progresses_user_movie_film_key"
ON "watch_progresses"("user_id", "movie_id")
WHERE "episode_id" IS NULL;
