-- Keep only the most recent duplicate before adding uniqueness guarantees.
DELETE FROM "watch_histories" older
USING "watch_histories" newer
WHERE older."user_id" = newer."user_id"
  AND older."movie_id" = newer."movie_id"
  AND older."episode_id" IS NOT DISTINCT FROM newer."episode_id"
  AND (
    older."watched_at" < newer."watched_at"
    OR (older."watched_at" = newer."watched_at" AND older."id" < newer."id")
  );

CREATE UNIQUE INDEX "watch_histories_user_movie_film_key"
ON "watch_histories"("user_id", "movie_id")
WHERE "episode_id" IS NULL;

CREATE UNIQUE INDEX "watch_histories_user_movie_episode_key"
ON "watch_histories"("user_id", "movie_id", "episode_id")
WHERE "episode_id" IS NOT NULL;

CREATE INDEX "watch_histories_user_id_watched_at_idx"
ON "watch_histories"("user_id", "watched_at");
